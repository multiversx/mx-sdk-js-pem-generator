const fs = require('fs');
const { Mnemonic } = require("@elrondnetwork/erdjs");

const generate = (filePath) => {
  const phrase = Mnemonic.generate();

  if ( filePath ) {
    fs.writeFileSync(filePath, phrase.toString());
    return;
  }

  console.log(phrase.toString());
};

module.exports = generate;
