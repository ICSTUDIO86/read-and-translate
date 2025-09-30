export interface Paragraph {
  id: string;
  text: string;
  translation?: string; // Deprecated - use type: 'translated' instead
  isHeading?: boolean;
  headingLevel?: number; // 1-6 for h1-h6
  isImage?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  type?: 'original' | 'translated'; // Indicates if this is original text or translation
  language?: string; // Language code (e.g., 'en', 'zh')
}

export interface Chapter {
  id: string;
  title: string;
  paragraphs: Paragraph[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  pages: number;
  language: string;
  audioLength: string;
  genre: string;
  synopsis: string;
  isFree: boolean;
  progress?: number;
  chapters?: Chapter[];
  currentChapter?: number;
  currentParagraph?: number;
}

export const books: Book[] = [
  {
    id: '1',
    title: 'The Psychology Of Money',
    author: 'Morgan Housel',
    cover: '/src/assets/book-psychology-money.jpg',
    rating: 4.4,
    pages: 262,
    language: 'English',
    audioLength: '2h14m',
    genre: 'Finance',
    synopsis: "Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
    isFree: true,
    progress: 35,
    currentChapter: 0,
    currentParagraph: 0,
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter 1: No One\'s Crazy',
        paragraphs: [
          {
            id: 'p1',
            text: 'Your personal experiences with money make up maybe 0.00000001% of what\'s happened in the world, but maybe 80% of how you think the world works.',
            translation: '你对金钱的个人经历可能只占世界上发生的事情的0.00000001%，但却占了你对世界运作方式看法的80%。',
          },
          {
            id: 'p2',
            text: 'We all do crazy stuff with money, because we\'re all relatively new to this game and what looks crazy to you might make sense to me. But no one is crazy—we all make decisions based on our own unique experiences that seem to make sense to us in a given moment.',
            translation: '我们都会用金钱做一些疯狂的事情，因为我们都是这个游戏的新手，在你看来疯狂的事情对我来说可能很有道理。但没有人是疯狂的——我们都是基于自己独特的经历做出决定，这些决定在当下对我们来说似乎是合理的。',
          },
          {
            id: 'p3',
            text: 'Some people are born into families that encourage education; others are against it. Some are born into flourishing economies encouraging of entrepreneurship; others are born into war and destitution. I want you to be successful, and I want you to earn it. But realize that not all success is due to hard work, and not all poverty is due to laziness. Keep this in mind when judging people, including yourself.',
            translation: '有些人出生在鼓励教育的家庭；有些人则相反。有些人出生在繁荣的经济体中，鼓励创业；有些人则出生在战争和贫困中。我希望你成功，我也希望你通过努力获得成功。但要认识到，并非所有的成功都是由于努力工作，也并非所有的贫困都是由于懒惰。在评判他人（包括你自己）时，请记住这一点。',
          },
          {
            id: 'p4',
            text: 'The challenge for us is that no amount of studying or open-mindedness can genuinely recreate the power of fear and uncertainty. I can read about what it was like to lose everything during the Great Depression. But I don\'t have the emotional scars of those who lived through it.',
            translation: '我们面临的挑战是，再多的学习或开放的心态都无法真正重现恐惧和不确定性的力量。我可以阅读关于大萧条时期失去一切的经历，但我没有那些经历过它的人的情感创伤。',
          },
        ]
      },
      {
        id: 'ch2',
        title: 'Chapter 2: Luck & Risk',
        paragraphs: [
          {
            id: 'p1',
            text: 'Nothing is as good or as bad as it seems. Luck and risk are siblings. They are both the reality that every outcome in life is guided by forces other than individual effort.',
            translation: '事情既没有看起来那么好，也没有看起来那么糟。运气和风险是兄弟姐妹。它们都是现实——生活中的每一个结果都受到个人努力之外的力量的引导。',
          },
          {
            id: 'p2',
            text: 'Bill Gates went to one of the only high schools in the world that had a computer. The school had a Mothers Club that raised money to buy a computer terminal. It was the first high school in the world to have one. That was an incredibly lucky break—and it contributed to his future success.',
            translation: '比尔·盖茨就读于世界上为数不多拥有计算机的高中之一。学校有一个母亲俱乐部，筹集资金购买了一台计算机终端。这是世界上第一所拥有计算机的高中。这是一个令人难以置信的幸运时刻——这对他未来的成功做出了贡献。',
          },
          {
            id: 'p3',
            text: 'But there was another student at that school who was just as skilled as Gates at programming and might have even been more skilled. His name was Kent Evans. He and Gates became best friends and started a company together. But Evans died in a mountaineering accident before he could take the next step.',
            translation: '但那所学校还有另一个学生，他的编程技能和盖茨一样熟练，甚至可能更加熟练。他的名字叫肯特·埃文斯。他和盖茨成为了最好的朋友，并一起创办了一家公司。但埃文斯在登山事故中去世，还没来得及迈出下一步。',
          },
          {
            id: 'p4',
            text: 'The accidental impact of actions outside of your control can be more consequential than the ones you consciously take. But when judging success—both your own and others\'—realize that not all success is due to hard work, and not all poverty is due to laziness.',
            translation: '你无法控制的行动所产生的意外影响，可能比你有意识采取的行动更具影响力。但在评判成功时——无论是你自己的还是他人的——要认识到，并非所有的成功都是由于努力工作，也并非所有的贫困都是由于懒惰。',
          },
        ]
      },
      {
        id: 'ch3',
        title: 'Chapter 3: Never Enough',
        paragraphs: [
          {
            id: 'p1',
            text: 'When rich people do crazy things. There is no reason to risk what you have and need for what you don\'t have and don\'t need. The hardest financial skill is getting the goalpost to stop moving.',
            translation: '当富人做疯狂的事情时。没有理由为了你没有且不需要的东西而冒险失去你拥有和需要的东西。最难的理财技能是让目标不再移动。',
          },
          {
            id: 'p2',
            text: 'Rajat Gupta was born in Kolkata and orphaned as a teenager. He became the first Indian-born head of McKinsey, the world\'s most prestigious consulting firm. He earned millions of dollars and was on the board of respected institutions. But he got involved in insider trading and was convicted and sentenced to prison.',
            translation: '拉贾特·古普塔出生在加尔各答，十几岁时成为孤儿。他成为世界上最负盛名的咨询公司麦肯锡的第一位印度裔负责人。他赚了数百万美元，并在受人尊敬的机构担任董事。但他卷入了内幕交易，被定罪并判处监禁。',
          },
          {
            id: 'p3',
            text: 'The question we should ask is: Why would someone who has everything take such risks? The answer seems to be that some things are never enough. There is no sense of enough. Modern capitalism is a pro at two things: generating wealth and generating envy.',
            translation: '我们应该问的问题是：为什么一个拥有一切的人会冒这样的风险？答案似乎是，有些东西永远不够。没有"足够"的概念。现代资本主义擅长两件事：创造财富和制造嫉妒。',
          },
          {
            id: 'p4',
            text: 'Happiness, as it\'s said, is just results minus expectations. The hardest financial skill is getting the goalpost to stop moving. But it\'s one of the most important. If expectations rise with results there is no logic in striving for more because you\'ll feel the same after putting in extra effort.',
            translation: '正如所说，幸福就是结果减去期望。最难的理财技能是让目标停止移动。但这是最重要的技能之一。如果期望随着结果而上升，那么追求更多就没有逻辑，因为在付出额外努力后，你会感觉一样。',
          },
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    cover: '/src/assets/book-sapiens.jpg',
    rating: 4.6,
    pages: 443,
    language: 'English',
    audioLength: '15h17m',
    genre: 'History',
    synopsis: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution that explores the ways in which biology and history have defined us.",
    isFree: true
  },
  {
    id: '3',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    cover: '/src/assets/book-design-everyday.jpg',
    rating: 4.5,
    pages: 368,
    language: 'English',
    audioLength: '11h45m',
    genre: 'Design',
    synopsis: "Design doesn't really start with aesthetics. It starts with understanding the user's needs and creating experiences that are intuitive and enjoyable.",
    isFree: false
  },
  {
    id: '4',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: '/src/assets/book-atomic-habits.jpg',
    rating: 4.8,
    pages: 320,
    language: 'English',
    audioLength: '5h35m',
    genre: 'Self-Help',
    synopsis: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear reveals practical strategies that will teach you exactly how to form good habits.',
    isFree: true,
    progress: 67
  },
  {
    id: '5',
    title: 'Deep Work',
    author: 'Cal Newport',
    cover: '/src/assets/book-deep-work.jpg',
    rating: 4.3,
    pages: 304,
    language: 'English',
    audioLength: '7h44m',
    genre: 'Productivity',
    synopsis: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information.",
    isFree: false
  },
  {
    id: '6',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    cover: '/src/assets/book-thinking-fast-slow.jpg',
    rating: 4.2,
    pages: 499,
    language: 'English',
    audioLength: '20h2m',
    genre: 'Psychology',
    synopsis: 'Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think and make choices.',
    isFree: true
  }
];

export const genres = ['All Genre', 'Finance', 'History', 'Design', 'Self-Help', 'Productivity', 'Psychology'];
