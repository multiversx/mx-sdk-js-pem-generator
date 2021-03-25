const fs = require('fs');

const BN = require('bn.js');
const { mnemonicToSeedSync } = require("bip39");
const { deriveMasterSK, deriveChildSKMultiple } = require("@chainsafe/bls-hd-key");
const { Mnemonic, BLS, ValidatorSecretKey, Address } = require("@elrondnetwork/erdjs");
const inquirer = require('inquirer');

const HARDENED_OFFSET = 0x80000000;
const BIP44_DERIVATION_PREFIX = "m/44'/508'/0'/";
const MAX_DEPTH = 2**31;

const questions = [
  {
    name: 'mnemonicPath',
    type: 'text',
    message: 'Please enter the path to your mnemonic file',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter the path to your mnemonic file';
      }
    }
  },
  {
    name: 'outputPath',
    type: 'text',
    message: 'Please enter the path where you want to save your pem files',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter the path where you want to save your pem files';
      }
    }
  }
];

const generate = async (count, account = 0, index = 0) => {
  await blsInit();

  if ( !count ) {
    count = 1;
  }

  let { mnemonicPath, outputPath } = await inquirer.prompt(questions);
  if ( !outputPath.endsWith('/') ) {
    outputPath = `${outputPath}/`;
  }

  if ( !fs.existsSync(mnemonicPath) ) {
    throw new Error(`Invalid mnemonicPath provided`);
  }

  const phraseText = fs.readFileSync(mnemonicPath).toString().trim();
  const phrase = Mnemonic.fromString(phraseText);

  let allValidatorKeys = ``;
  const { keys } = generateKeys(phrase.toString(), count, account, index);
  for ( let i = 0; i < keys.length; i++ ) {
    const { key } = keys[i];
    const pubKey = blsPubKey(key.toString('hex'));
    let keyBuff = [];
    [...key.toString('hex')].map(hexBuff => keyBuff.push(Buffer.from(hexBuff)));


    fs.writeFileSync(`${outputPath}validator${i}.pem`, `-----BEGIN PRIVATE KEY for ${pubKey}-----\r\n${Buffer.concat(keyBuff).toString('base64')}\r\n-----END PRIVATE KEY for ${pubKey}-----`);
    allValidatorKeys = `${allValidatorKeys}-----BEGIN PRIVATE KEY for ${pubKey}-----\r\n${Buffer.concat(keyBuff).toString('base64')}\r\n-----END PRIVATE KEY for ${pubKey}-----\r\n`;
  }

  fs.writeFileSync(`${outputPath}validators-all.pem`, allValidatorKeys);
};

function splitPath(path) {
  return path.split("/")
    .slice(1)
    .map(p => p.replace("'", ""))
    .map(p => parseInt(p, 10))
    .map(p => p + HARDENED_OFFSET);
}

function generateKeys(mnemonic, count, account, index) {
  if ( account < 0 || account > MAX_DEPTH ) {
    throw new Error("Invalid account provided");
  }
  if ( index < 0 || index > MAX_DEPTH ) {
    throw new Error("Invalid index provided");
  }

  let finalIndex = index + count;
  if ( finalIndex > MAX_DEPTH ) {
    account++;
    index = 0;
  }
  if ( account > MAX_DEPTH ) {
    throw new Error("Invalid account provided");
  }

  const derivationPaths = [];
  for ( let i = 0; i < count; i++ ) {
    derivationPaths.push(`${BIP44_DERIVATION_PREFIX}${account}'/${index + i}'`);
  }

  const entropy = mnemonicToSeedSync(mnemonic);
  const masterKey = deriveMasterSK(Buffer.from(entropy));

  const generatedKeys = [];
  for ( let path of derivationPaths ) {
    const bigEndian = deriveChildSKMultiple(masterKey, splitPath(path));
    const key = flipEndianness(bigEndian);
    generatedKeys.push({key, derivation_path: path});
  }

  return {
    keys: generatedKeys,
    account: account,
    index: index + count,
  };
}

function flipEndianness(bnBuff) {
  const mybn = new BN(bnBuff.toString('hex'), 16, 'be');
  return Buffer.from(mybn.toArray('le', 32));
}

async function blsInit() {
  return await BLS.initIfNecessary();
}

function blsPubKey(skeyHex) {
  const skey = new ValidatorSecretKey(Buffer.from(skeyHex, 'hex'));
  return skey.generatePublicKey().hex();
}





module.exports = generate;
