# Elrond Pem Generator

This is a small tool we wrote to assist validators in generating a bunch of pem files given a mnemonic. <br/>

## How to use
### First option:
```
$ npm install -g @elrondnetwork/elrond-pem
$ elrond-pem generate-mnemonic ./path-to-file/mnemonic.txt
$ elrond-pem generate-pems 10 0 0 # The parameters used are: numberOfPems, accountIndex, addressIndex
$   # You will be prompted to enter a path to a file containing your mnemonic, then a path to the output folder.
```

### Second option - if you don't want it installed globally
```
$ git clone git@github.com:ElrondNetwork/elrond-pem-js.git && cd elrond-pem-js
$ node ./index.js generate-mnemonic
$ node ./index.js 10 0 0
```
