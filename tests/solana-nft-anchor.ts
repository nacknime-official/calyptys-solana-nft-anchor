import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { SolanaNftAnchor } from "../target/types/solana_nft_anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { findMasterEditionPda, findMetadataPda, mplTokenMetadata, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { publicKey } from "@metaplex-foundation/umi";
import { min } from "bn.js";


describe("solana-nft-anchor", async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaNftAnchor as Program<SolanaNftAnchor>;

  const signer = provider.wallet;

  const umi = createUmi(clusterApiUrl("devnet"))
    .use(walletAdapterIdentity(signer))
    .use(mplTokenMetadata());

  const mint = anchor.web3.Keypair.generate();
  const associatedTokenAccount = await getAssociatedTokenAddress(mint.publicKey, signer.publicKey);
  let metadataAccount = findMetadataPda(umi, { mint: publicKey(mint.publicKey) })[0];
  let masterEditionAccount = findMasterEditionPda(umi, { mint: publicKey(mint.publicKey) })[0];
  const metadata = {
    name: "Kobeni",
    symbol: "KBN",
    uri: "https://raw.githubusercontent.com/687c/solana-nft-native-client/main/metadata.json",
  };

  it("mints nft!", async () => {
    const tx = await program.methods.initNft(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: signer.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
        metadataAccount,
        masterEditionAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    console.log(`mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log(`minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);
  })

  // it("Is initialized!", async () => {
  //   // Add your test here.
  //   const tx = await program.methods.initialize().rpc();
  //   console.log("Your transaction signature", tx);
  // });
});
