// @ts-ignore
import sshpk from "sshpk";
import _ from "lodash";
import { bytesToBigInt, toCircomBigIntBytes } from "../binaryFormat";
import { poseidonK } from "../poseidonHash";
import { buildMerkleTree } from "../merkle";

export async function resolveGroupIdentifierTree(
  groupIdentifier: string
): Promise<string[]> {
  // groupIdentifier can either be a newline separated list of SSH keys, or a link of the form
  // (https?://)?(www|api.)?merkleroots.xyz(/tree)?/root
  // If it's a link, we'll fetch the tree from the server
  // Else we compute the merkle tree by parsing the SSH keys into RSA moduluses and hashing their circom bigint representations
  groupIdentifier = groupIdentifier
    .replaceAll("https://", "")
    .replaceAll("http://", "")
    .replaceAll("www.", "")
    .replaceAll("api.", "")
    .replaceAll("/tree/", "/");
  if (groupIdentifier.startsWith("merkleroots.xyz")) {
    const root = groupIdentifier.split("merkleroots.xyz/")[1];
    const response = await (
      await fetch(`https://api.merkleroots.xyz/tree/${root}`)
    ).json();
    const json = (await response.json()).nodes; // returns array of hashes
    return json;
  }

  const leaves = _.sortBy(
    _.compact(groupIdentifier.split("\n").map((s) => s.trim())).map((key) =>
      poseidonK(
        toCircomBigIntBytes(
          bytesToBigInt(sshpk.parseKey(key, "ssh").parts[1].data)
        )
      )
    )
  );
  return buildMerkleTree(leaves);
}

export async function resolveGroupIdentifierRoot(
  groupIdentifier: string
): Promise<string> {
  // groupIdentifier can either be a newline separated list of SSH keys, or a link of the form
  // (https?://)?(www|api.)?merkleroots.xyz(/tree)?/root
  // If it's a link, we'll fetch the tree from the server
  // Else we compute the merkle tree by parsing the SSH keys into RSA moduluses and hashing their circom bigint representations
  groupIdentifier = groupIdentifier
    .replaceAll("https://", "")
    .replaceAll("http://", "")
    .replaceAll("www.", "")
    .replaceAll("api.", "")
    .replaceAll("/tree/", "/");
  if (groupIdentifier.startsWith("merkleroots.xyz")) {
    const root = groupIdentifier.split("merkleroots.xyz/")[1];
    return root;
  }

  const leaves = _.sortBy(
    _.compact(groupIdentifier.split("\n").map((s) => s.trim())).map((key) =>
      poseidonK(
        toCircomBigIntBytes(
          bytesToBigInt(sshpk.parseKey(key, "ssh").parts[1].data)
        )
      )
    )
  );
  return buildMerkleTree(leaves)[1];
}
