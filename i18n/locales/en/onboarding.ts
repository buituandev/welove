const onboarding = {
    title: 'Create your profile',
    subtitle: 'Tell us a little about yourself to get started.',
    avatar: {
        placeholder: 'Photo',
        edit: 'Edit',
    },
    name: {
        label: 'Full name *',
        placeholder: 'Your name',
    },
    birthday: {
        label: 'Date of birth *',
        placeholder: 'Select date of birth',
        requirement: 'You must be at least 18 years old.',
    },
    bio: {
        label: 'Bio (optional)',
        placeholder: 'Say something about yourself…',
        counterSuffix: '/160',
    },
    submit: 'Continue',
} as const;

export default onboarding;

