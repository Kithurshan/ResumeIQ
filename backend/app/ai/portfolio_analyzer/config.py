# Simple settings used by the analyzer.

MAX_PAGES = 80
REQUEST_TIMEOUT = 20

USER_AGENT = (
    "ResumeIQ Portfolio Analyzer/3.0 "
    "(educational portfolio analysis)"
)

# Pages containing these words are checked earlier.
IMPORTANT_WORDS = [
    "about",
    "experience",
    "work",
    "project",
    "portfolio",
    "archive",
    "writing",
    "blog",
    "resume",
    "cv",
    "case-study",
]

# Technologies that the analyzer knows how to recognize.
# A technology is reported only when it is actually found in website evidence.
TECHNOLOGIES = [
    "JavaScript", "TypeScript", "Python", "PHP", "Ruby", "Java",
    "C#", "C++", "Go", "Rust",
    "HTML", "HTML5", "CSS", "SCSS", "Sass",
    "Tailwind CSS", "Bootstrap",
    "React", "React Native", "Next.js", "Angular", "Vue", "Vue.js", "Svelte",
    "Node.js", "Express", "Express.js", "Flask", "Django", "Ruby on Rails",
    "MySQL", "PostgreSQL", "MongoDB", "Firebase", "Redis",
    "WordPress", "Contentful", "Jekyll", "Gatsby", "Eleventy",
    "Storybook", "Redux", "Redux Toolkit", "GraphQL", "REST API",
    "Spotify API", "jQuery", "Backbone", "Backbone.js",
    "Marionette", "Marionette.js", "Ember", "Ember.js",
    "Cordova", "Webpack", "Vite", "Docker", "Git", "GitHub",
    "Figma", "Netlify", "Vercel", "Heroku", "AWS", "Azure", "GCP",
    "Framer Motion", "Styled Components", "MusicKit.js",
    "Airtable", "Stripe", "Algolia", "Formik"
]
