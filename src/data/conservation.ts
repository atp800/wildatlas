import { CONSERVATION_PERCENTAGE } from '../lib/conservation';

// Cause content and confirmed charitable transfers. Purchase commitments are
// calculated from Stripe; donatedPence changes only after an actual donation.
export const conservation = {
  donationPercentage: CONSERVATION_PERCENTAGE,
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
