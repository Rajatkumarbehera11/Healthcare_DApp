import { PINATA_JWT, PINATA_GATEWAY } from "../config/contract";

export async function uploadFileToIPFS(file) {
  if (!file) throw new Error("No file provided");

  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to IPFS");
  }

  const data = await response.json();
  return `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`;
}
