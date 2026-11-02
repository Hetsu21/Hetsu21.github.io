/*
 * SHARED PORTFOLIO CONTENT
 * Identity, contact links, and project settings come from your French CV.
 * Edit translated text in locales/en.json, fr.json, and es.json.
 * To add a project, copy an object below and assign a unique number. Add
 * its translated title and description under projects.items.<number>.
 * Set url to the project or repository link when you have one.
 * Leave unavailable links empty; contact buttons omit missing links.
 * Edit quote text and authors in quotes.json; quotes are not translated.
 */
const portfolio = {
  name: 'Jose-Luis Caceres Reyna',
  bio: 'I contribute to Rx-APA, working on React and React Native applications, internationalization, form validation, and technical troubleshooting. I use Git and GitLab in a collaborative workflow with CI/CD, testing, code review, and documentation.\n\nI feel like I always need something to keep my mind engaged. That’s part of why I enjoy reading books such as Think Like a Programmer by V. Anton Spraul and Co-Intelligence: Living and Working with AI by Ethan Mollick. I’m also learning Japanese on the side.\n\nI also enjoy trading card games for the thinking they involve: building a deck, finding unexpected combinations, and deciding how to use limited resources to reach a goal. I like working out a plan, then adapting it as the game changes.\n\nI also enjoy optimizing things: spotting unnecessary steps, simplifying a process, and finding a more efficient way to get the same result.',
  skills: [
    'Java',
    'Python',
    'JavaScript',
    'C++',
    'SQL',
    'React',
    'React Native',
    'Flask',
    'Node.js',
    'HTML5',
    'CSS3',
    'REST APIs',
    'SQLite',
    'Git',
    'GitLab',
    'Docker',
    'CI/CD',
    'Maven',
    'Linux',
    'VS Code',
    'cURL',
    'jq',
  ],
  // Used only by the Contact me mailto button; not displayed as page text.
  email: 'jose-luis_cr@outlook.com',
  // Add full profile URLs here; empty values show inactive icons.
  github: 'https://github.com/Hetsu21',
  x: 'https://x.com/HetsuCS',
  linkedin: 'https://www.linkedin.com/in/jose-luis-caceres-reyna-19049128b/',
  projects: [
    {
      title: 'University Registration API',
      category: 'Web',
      rarity: 'RARE',
      number: '001',
      art: 'terminal',
      // Replace with a screenshot path; leave empty to use the fallback artwork.
      image: 'assets/projects/registration-api.svg',
      description:
        'Designed and implemented a Java/Jersey REST API for university registration. Built CRUD services for six entities with JSON data, automated builds with Maven, and ran integration tests with cURL and jq. Used Git for version control and collaborative development.',
      tags: ['Java', 'Jersey', 'Maven', 'JSON', 'cURL', 'jq'],
      url: '',
      sample: false,
    },
    // This relative URL opens the current website on local or hosted previews.
    {
      title: 'Personal Portfolio',
      description:
        'A multilingual portfolio built with HTML, CSS, and JavaScript. Features English, French, and Spanish content, a shared JSON quote collection, project card popups, and a Node.js build script that assembles separate HTML sections.',
      category: 'Web',
      rarity: 'UNCOMMON',
      number: '002',
      art: 'orbit',
      image: 'assets/projects/portfolio.svg',
      tags: ['HTML', 'CSS', 'JavaScript', 'JSON', 'Node.js'],
      url: './',
      sample: false,
    },
  ],
};
