# TODO - Feature Backlog

- [ ] Player trip statistics
  - [ ] Add a `Stats` button in the Players panel header
  - [ ] Show modal with per-player and overall stats
    - [ ] Per player: number of stops, number of visited cities, total trip payout, average leg payout, longest leg, last 3 legs
    - [ ] Overall: combined trip payout, most-visited cities (top 5)
  - [ ] Export to CSV from the stats modal
  - Acceptance:
    - Stats open instantly and reflect current in-memory data
    - Closing and reopening reflects live updates without reload

- [ ] Re-order players
  - [ ] Support drag-and-drop reordering (keyboard accessible)
  - [ ] Persist order in localStorage export/import
  - [ ] Add small up/down buttons as a fallback if DnD not available
  - Acceptance:
    - Reordering updates immediately and persists after page reload

- [ ] Destination roller (optional utility)
  - [ ] Add a compact Roller UI near each player's last stop row
  - [ ] Provide a basic “Random destination” button that picks a different city than the current last stop (and avoids Home unless confirmed)
  - [ ] Advanced (optional): 2d6 dice animation + odd/even toggle to mimic table-based selection
  - [ ] On choose, auto-add stop and compute payout from previous
  - Acceptance:
    - Random destination adds a new stop and shows the computed payout
    - Can undo by deleting the stop

- [ ] Train upgrades (Super Chief and others)
  - [ ] Add a `Train` selector to each player card (e.g., Standard, Express, Super Chief)
  - [ ] Persist in localStorage export/import
  - [ ] (Optional) If rules imply effects on gameplay or payouts, surface contextual hints next to stops
  - Acceptance:
    - Train selection is clearly visible and persists across sessions

---

Implementation notes
- Use existing code patterns: minimal reflows, re-render current player card on changes
- Keep everything client-side, no new build tooling
- Maintain data compatibility by extending the persisted `state.players[]` objects rather than replacing them
- Accessibility: ensure buttons and drag handles are keyboard reachable and have ARIA labels

