// Starting values for the Conservation page. These are real zero totals,
// not the sample figures from the design. Payment tracking and verified
// voting are not connected yet; do not populate these with estimates.
export const conservation = {
  donationPercentage: 10,
  committedPence: 0,
  donatedPence: 0,
  causes: [
    {
      id: 'marine-life',
      title: 'Marine life',
      description: 'Protect whales and the oceans they call home.',
      color: '#66848b',
    },
    {
      id: 'wild-habitats',
      title: 'Wild habitats',
      description: 'Keep wild places thriving for future generations.',
      color: '#829277',
    },
    {
      id: 'coral-reefs',
      title: 'Coral reefs',
      description: 'Support the extraordinary life beneath the surface.',
      color: '#b5a382',
    },
  ],
};
