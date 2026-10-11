/**
 * Remove anyone on either side of a block with the need's creator.
 *
 * Fails closed: if the block list could not be read, nobody is returned,
 * because we cannot prove a blocked person would be hidden.
 */
export function excludeBlocked(
  userIds: Iterable<string>,
  creatorId: string,
  blocks: { blocker_id: string; blocked_id: string }[] | null,
  readFailed: boolean,
): Set<string> {
  if (readFailed) return new Set();
  const result = new Set(userIds);
  for (const block of blocks ?? []) {
    if (block.blocker_id === creatorId) result.delete(block.blocked_id);
    else if (block.blocked_id === creatorId) result.delete(block.blocker_id);
  }
  return result;
}
