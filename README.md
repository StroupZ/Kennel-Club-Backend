# Kennel Club NFT Marketplace Backend
Link to frontend: https://github.com/StroupZ/Kennel-Club
<br>
Link to graph indexer: https://github.com/StroupZ/Kennel-Club-Graph
<br><br>
This is the backend/smart contract portion for the Kennel Club NFT Marketplace... a dApp which enables the buying, listing, managing, browsing, and selling of NFTs. The smart contract was written in solidity and deployed to the Goerli Testnet, enabling it to be decentralized, transparent, and immutable. It is complimented with a thorough suite of unit tests. It also utilizes The Graph protocol for indexing.
<br><br>
## Tech Stack
- JavaScript for writing tests and scripts
- Solidity for writing smart contracts
- Node.js for testing
- Ethers.js for testing and deploying smart contracts
- Hardhat for testing and deploying smart contracts
- The Graph protocol for indexing
<br><br>
## Use
1. Make sure you have an IDE and Node.js installed.
2. Clone this repo.
3. Run `yarn add` to install all dependencies.
4. Create a `.env` file with the following information:
   - `GOERLI_RPC_URL=YOUR_GOERLI_RPC_URL`
   - `PRIVATE_KEY=YOUR_PRIVATE_KEY`
   - `COINMARKETCAP_API_KEY=YOUR_COINMARKETCAP_API_KEY`
   - `ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY`
   - `UPDATE_FRONT_END=true`
5. Replace values for `frontEndContractsFile` and `frontEndAbiLocation` in `helper-hardhat-config` with your own from instructions for frontend [here.](https://github.com/StroupZ/Kennel-Club)
6. Replace values for `frontEndContractsFile2` and `frontEndAbiLocation2` in `helper-hardhat-config` with your own from instructions for graph indexer [here.](https://github.com/StroupZ/Kennel-Club-Graph)
7. Run `yarn hardhat node` to deploy contracts on localhost.
8. Run `yarn hardhat deploy --network goerli` to deploy contracts on Goerli Testnet.
<br><br>
## Test
- Run `yarn hardhat test` to run unit tests on localhost.
<br><br>
## Faucet
- [Goerli ETH](https://goerlifaucet.com/)
