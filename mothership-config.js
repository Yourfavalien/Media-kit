window.YFA_MOTHERSHIP = {
  supabaseUrl: 'https://qpwjfsigvoktsaeiypyy.supabase.co',
  publishableKey: 'sb_publishable_THWa8IbRa_YTSr1bOxonhQ_GCq3J-A9',
  bucket: 'mothership-images',
  themePath: 'theme/theme.json',
  slots: [
    { id: 'home-orbit-visual', group: 'Home', label: 'Orbit popup photo', path: 'slots/home-orbit-visual' },
    { id: 'socials-hero', group: 'Socials', label: 'Socials hero photo', path: 'slots/socials-hero' },
    { id: 'socials-tiktok-profile', group: 'Socials', label: 'TikTok profile photo', path: 'slots/socials-tiktok-profile' },
    { id: 'socials-instagram-profile', group: 'Socials', label: 'Instagram profile photo', path: 'slots/socials-instagram-profile' },
    { id: 'socials-snapchat-profile', group: 'Socials', label: 'Snapchat profile photo', path: 'slots/socials-snapchat-profile' },
    { id: 'socials-facebook-profile', group: 'Socials', label: 'Facebook profile photo', path: 'slots/socials-facebook-profile' },
    { id: 'subscribe-main', group: 'Subscribe', label: 'Subscribe page photo', path: 'slots/subscribe-main' },
    { id: 'media-kit-banner', group: 'Media Kit', label: 'Media Kit banner', path: 'slots/media-kit-banner' }
  ],
  colorGroups: [
    {
      group: 'Main Site',
      note: 'These colors are shared by the main Home, About, Contact, and Subscribe design.',
      colors: [
        { id:'main-bg', label:'Main background', cssVar:'--black', default:'#0a0507', pages:['home','about','contact','subscribe'] },
        { id:'main-dark', label:'Dark secondary', cssVar:'--dark', default:'#12080d', pages:['home','about','contact','subscribe'] },
        { id:'main-accent', label:'Main accent', cssVar:'--magenta', default:'#b5175e', pages:['home','about','contact','subscribe'] },
        { id:'main-accent-hover', label:'Accent hover', cssVar:'--magenta-dark', default:'#8b1148', pages:['home','about','contact','subscribe'] },
        { id:'main-cyan', label:'Cyan accent', cssVar:'--cyan', default:'#4de8d8', pages:['home','about','contact','subscribe'] },
        { id:'main-yellow', label:'Yellow accent', cssVar:'--yellow', default:'#f5c518', pages:['home','about','contact','subscribe'] },
        { id:'main-text', label:'Main text', cssVar:'--white', default:'#f0ece8', pages:['home','about','contact','subscribe'] },
        { id:'main-light', label:'Light panel', cssVar:'--gray-light', default:'#e8e4e0', pages:['home','about','contact','subscribe'] }
      ]
    },
    {
      group: 'Orbit Popup',
      note: 'Controls the cream signup popup that appears on the main-site pages.',
      colors: [
        { id:'orbit-text', label:'Orbit text / ink', cssVar:'--yfa-orbit-ink', default:'#17181c', pages:['home','about','contact','subscribe'] },
        { id:'orbit-bg', label:'Orbit cream', cssVar:'--yfa-orbit-cream', default:'#f8f6ec', pages:['home','about','contact','subscribe'] },
        { id:'orbit-bg-deep', label:'Orbit cream shade', cssVar:'--yfa-orbit-cream-deep', default:'#f1eedf', pages:['home','about','contact','subscribe'] },
        { id:'orbit-button', label:'Orbit button', cssVar:'--yfa-orbit-button', default:'#1c2028', pages:['home','about','contact','subscribe'] },
        { id:'orbit-button-hover', label:'Orbit button hover', cssVar:'--yfa-orbit-button-hover', default:'#0f1218', pages:['home','about','contact','subscribe'] }
      ]
    },
    {
      group: 'Socials',
      note: 'Controls the Socials page background, cards, accents, and platform colors.',
      colors: [
        { id:'socials-bg', label:'Page background', cssVar:'--sage', default:'#bccfbc', pages:['socials'] },
        { id:'socials-accent', label:'Accent', cssVar:'--magenta', default:'#b5175e', pages:['socials'] },
        { id:'socials-accent-hover', label:'Accent hover', cssVar:'--magenta-dark', default:'#8b1148', pages:['socials'] },
        { id:'socials-text', label:'Light text', cssVar:'--white', default:'#f0ece8', pages:['socials'] },
        { id:'socials-card', label:'Card background', cssVar:'--yfa-social-card', default:'#1a1a1a', pages:['socials'] },
        { id:'socials-card-inner', label:'Card inner background', cssVar:'--yfa-social-card-inner', default:'#2a2a2a', pages:['socials'] },
        { id:'socials-facebook', label:'Facebook button', cssVar:'--yfa-social-facebook', default:'#1877f2', pages:['socials'] },
        { id:'socials-snapchat', label:'Snapchat accent', cssVar:'--yfa-social-snapchat', default:'#fffc00', pages:['socials'] },
        { id:'socials-pinterest', label:'Pinterest button', cssVar:'--yfa-social-pinterest', default:'#e60023', pages:['socials'] },
        { id:'socials-media-warm', label:'Media Kit warm tone', cssVar:'--yfa-social-media-warm', default:'#8e4e36', pages:['socials'] }
      ]
    },
    {
      group: 'Subscribe',
      note: 'Extra colors used only on the Subscribe page.',
      colors: [
        { id:'subscribe-grad-start', label:'Background gradient start', cssVar:'--yfa-subscribe-bg-start', default:'#8898aa', pages:['subscribe'] },
        { id:'subscribe-grad-mid', label:'Background gradient middle', cssVar:'--yfa-subscribe-bg-mid', default:'#c0ccd8', pages:['subscribe'] },
        { id:'subscribe-grad-end', label:'Background gradient end', cssVar:'--yfa-subscribe-bg-end', default:'#6878a0', pages:['subscribe'] },
        { id:'subscribe-heading', label:'Card heading', cssVar:'--yfa-subscribe-heading', default:'#222222', pages:['subscribe'] },
        { id:'subscribe-copy', label:'Card copy', cssVar:'--yfa-subscribe-copy', default:'#555555', pages:['subscribe'] }
      ]
    },
    {
      group: 'Media Kit',
      note: 'Controls the separate YourFavAlien Media Kit site.',
      colors: [
        { id:'media-bg', label:'Lilac background', cssVar:'--lilac', default:'#c7b6c3', pages:['media-kit'] },
        { id:'media-ink', label:'Ink / text', cssVar:'--ink', default:'#191817', pages:['media-kit'] },
        { id:'media-paper', label:'Paper / light cards', cssVar:'--paper', default:'#ece4e8', pages:['media-kit'] },
        { id:'media-contact', label:'Partnership section', cssVar:'--yfa-media-contact', default:'#8e4e36', pages:['media-kit'] },
        { id:'media-contact-text', label:'Partnership text', cssVar:'--yfa-media-contact-text', default:'#f2e9e4', pages:['media-kit'] },
        { id:'media-available', label:'Available status dot', cssVar:'--yfa-media-available', default:'#2fae4e', pages:['media-kit'] },
        { id:'media-modal', label:'Form / modal background', cssVar:'--yfa-media-modal', default:'#f3ecef', pages:['media-kit'] }
      ]
    }
  ]
};
