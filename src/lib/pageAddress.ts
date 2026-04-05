export function getPageAddress(pubkey: string, identifier: string): string {
  return `30512:${pubkey}:${identifier}`;
}

export default getPageAddress;
