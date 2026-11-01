// Marketing photos (Unsplash, free license). Swap for real customer photos later.
const u = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`

export const IMG = {
  // Couple in red/blue áo dài in an old-town alley
  hero: (w = 2000) => u("photo-1760410179576-a2764d7ce91f", w),
  // Couple in white áo dài holding flowers
  aoDai: (w = 1200) => u("photo-1777917676270-ce763c4f0833", w),
  // Groomsmen carrying red flower trays
  procession: (w = 2000) => u("photo-1791276091344-a3a38f43ea90", w),
  // Long banquet table
  banquet: (w = 1200) => u("photo-1561593367-66c79c2294e6", w),
  // Name place card on a plate
  placeCard: (w = 1200) => u("photo-1520245787685-fb1e6732fb76", w),
  // Bride at the reception backdrop
  reception: (w = 1200) => u("photo-1791276091377-58c2553d5b5f", w),
}
