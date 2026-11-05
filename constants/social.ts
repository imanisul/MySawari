import { ImageSourcePropType } from 'react-native';

export type SocialLink = {
  id: 'x' | 'instagram' | 'linkedin' | 'facebook';
  /** Used for accessibility: "Follow MySawari on <label>". */
  label: string;
  /** Logo image (PNG, assets/images/social). */
  image: ImageSourcePropType;
  /** Single-colour logo (X): drawn in the theme's text colour so it shows on light and dark. */
  themed?: boolean;
  /** MySawari's page. Leave empty until the account exists — an empty link is simply not shown. */
  url: string;
};

// Shown in this order under "Your ride, your way." on the Home page.
// Instagram and Facebook are the accounts linked from mysawari.in; LinkedIn is the MySawari company page.
export const SOCIAL_LINKS: SocialLink[] = [
  { id: 'x', label: 'X', image: require('../assets/images/social/x.png'), themed: true, url: '' },
  { id: 'instagram', label: 'Instagram', image: require('../assets/images/social/instagram.png'), url: 'https://www.instagram.com/mysawari' },
  { id: 'linkedin', label: 'LinkedIn', image: require('../assets/images/social/linkedin.png'), url: 'https://www.linkedin.com/company/mysawari' },
  { id: 'facebook', label: 'Facebook', image: require('../assets/images/social/facebook.png'), url: 'https://www.facebook.com/share/1cobmf7nKh/' },
];
