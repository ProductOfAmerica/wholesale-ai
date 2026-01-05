import type { LessonsResponse, VideoLesson } from '@wholesale-ai/shared';
import { LessonCategory } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

const mockLessons: VideoLesson[] = [
  {
    id: 'lesson-001',
    title: 'Introduction to Wholesaling',
    description:
      'Learn the fundamentals of real estate wholesaling - what it is, how it works, and why it can be a great entry point into real estate investing.',
    videoUrl: '/videos/intro-wholesaling.mp4',
    thumbnailUrl: '/thumbnails/intro-wholesaling.jpg',
    duration: 1200,
    category: LessonCategory.FUNDAMENTALS,
    tags: ['beginner', 'overview', 'basics'],
    timestamps: [
      { time: 0, label: 'What is Wholesaling?', topic: 'definition' },
      { time: 180, label: 'How Wholesaling Works', topic: 'process' },
      { time: 420, label: 'Assignment vs Double Close', topic: 'strategies' },
      { time: 720, label: 'Finding Your First Deal', topic: 'getting-started' },
      { time: 960, label: 'Common Mistakes to Avoid', topic: 'pitfalls' },
    ],
    relatedStrategies: ['assignment', 'double-close'],
  },
  {
    id: 'lesson-002',
    title: 'The MAO Formula Explained',
    description:
      'Master the Maximum Allowable Offer formula - the cornerstone calculation for profitable wholesale deals.',
    videoUrl: '/videos/mao-formula.mp4',
    thumbnailUrl: '/thumbnails/mao-formula.jpg',
    duration: 900,
    category: LessonCategory.FUNDAMENTALS,
    tags: ['mao', 'arv', 'calculations', 'profit'],
    timestamps: [
      { time: 0, label: 'Why MAO Matters', topic: 'importance' },
      { time: 120, label: 'The 70% Rule', topic: 'rule' },
      { time: 300, label: 'Calculating ARV', topic: 'arv' },
      { time: 540, label: 'Estimating Repairs', topic: 'repairs' },
      { time: 720, label: 'Setting Your Wholesale Fee', topic: 'fees' },
    ],
    relatedStrategies: ['mao', 'arv-analysis'],
  },
  {
    id: 'lesson-003',
    title: 'Subject-To Financing Fundamentals',
    description:
      'Discover how to acquire properties subject to the existing mortgage - a powerful creative financing strategy.',
    videoUrl: '/videos/subject-to.mp4',
    thumbnailUrl: '/thumbnails/subject-to.jpg',
    duration: 1500,
    category: LessonCategory.CREATIVE_FINANCE,
    tags: ['subject-to', 'creative-finance', 'mortgage', 'advanced'],
    timestamps: [
      { time: 0, label: 'What is Subject-To?', topic: 'definition' },
      { time: 240, label: 'When to Use Subject-To', topic: 'scenarios' },
      { time: 480, label: 'Due-on-Sale Clause', topic: 'risks' },
      { time: 780, label: 'Structuring the Deal', topic: 'structure' },
      { time: 1080, label: 'Exit Strategies', topic: 'exits' },
      { time: 1320, label: 'Documentation Required', topic: 'paperwork' },
    ],
    relatedStrategies: ['subject-to', 'wrap-mortgage', 'lease-option'],
  },
  {
    id: 'lesson-004',
    title: 'The Morby Method Deep Dive',
    description:
      'Learn the Morby Method - combining subject-to with seller finance for zero-down creative acquisitions.',
    videoUrl: '/videos/morby-method.mp4',
    thumbnailUrl: '/thumbnails/morby-method.jpg',
    duration: 1800,
    category: LessonCategory.CREATIVE_FINANCE,
    tags: ['morby-method', 'creative-finance', 'seller-finance', 'advanced'],
    timestamps: [
      { time: 0, label: 'Introduction to Morby Method', topic: 'intro' },
      { time: 300, label: 'The Hybrid Structure', topic: 'structure' },
      { time: 600, label: 'Finding Morby Candidates', topic: 'sourcing' },
      { time: 900, label: 'Presenting to Sellers', topic: 'presentation' },
      { time: 1200, label: 'Calculating the Numbers', topic: 'math' },
      { time: 1500, label: 'Closing the Deal', topic: 'closing' },
    ],
    relatedStrategies: ['morby-method', 'subject-to', 'seller-finance'],
  },
  {
    id: 'lesson-005',
    title: 'Handling Seller Objections',
    description:
      'Master the art of overcoming common seller objections with proven scripts and techniques.',
    videoUrl: '/videos/objections.mp4',
    thumbnailUrl: '/thumbnails/objections.jpg',
    duration: 1350,
    category: LessonCategory.NEGOTIATION,
    tags: ['objections', 'scripts', 'negotiation', 'sales'],
    timestamps: [
      { time: 0, label: 'Understanding Objections', topic: 'mindset' },
      { time: 180, label: '"Your offer is too low"', topic: 'price-objection' },
      { time: 420, label: '"I need to think about it"', topic: 'stall' },
      { time: 660, label: '"I want to list with an agent"', topic: 'agent' },
      { time: 900, label: '"I\'m not in a hurry"', topic: 'urgency' },
      { time: 1140, label: 'Creating Win-Win Solutions', topic: 'resolution' },
    ],
    relatedStrategies: ['negotiation', 'rapport-building'],
  },
  {
    id: 'lesson-006',
    title: 'TCPM Discovery Framework',
    description:
      'Use the Timeline-Condition-Price-Motivation framework to quickly qualify sellers and uncover hidden opportunities.',
    videoUrl: '/videos/tcpm.mp4',
    thumbnailUrl: '/thumbnails/tcpm.jpg',
    duration: 1050,
    category: LessonCategory.NEGOTIATION,
    tags: ['tcpm', 'qualification', 'discovery', 'framework'],
    timestamps: [
      { time: 0, label: 'The TCPM Framework', topic: 'overview' },
      { time: 150, label: 'Timeline Questions', topic: 'timeline' },
      { time: 360, label: 'Condition Questions', topic: 'condition' },
      { time: 540, label: 'Price Discovery', topic: 'price' },
      { time: 720, label: 'Motivation Uncovering', topic: 'motivation' },
      { time: 900, label: 'Putting It All Together', topic: 'application' },
    ],
    relatedStrategies: ['tcpm', 'seller-qualification'],
  },
  {
    id: 'lesson-007',
    title: 'Texas Wholesaling Compliance',
    description:
      'Stay legal in Texas - understand licensing requirements, disclosure rules, and contract best practices.',
    videoUrl: '/videos/texas-compliance.mp4',
    thumbnailUrl: '/thumbnails/texas-compliance.jpg',
    duration: 1200,
    category: LessonCategory.COMPLIANCE,
    tags: ['texas', 'legal', 'compliance', 'licensing'],
    timestamps: [
      { time: 0, label: 'Texas Real Estate Laws', topic: 'laws' },
      { time: 240, label: 'When You Need a License', topic: 'licensing' },
      { time: 480, label: 'Required Disclosures', topic: 'disclosures' },
      { time: 720, label: 'Contract Requirements', topic: 'contracts' },
      { time: 960, label: 'Common Violations', topic: 'violations' },
    ],
    relatedStrategies: ['compliance', 'contracts'],
  },
  {
    id: 'lesson-008',
    title: 'Building Your Buyers List',
    description:
      'Create and nurture a powerful buyers list - your key to fast dispositions and consistent profits.',
    videoUrl: '/videos/buyers-list.mp4',
    thumbnailUrl: '/thumbnails/buyers-list.jpg',
    duration: 1100,
    category: LessonCategory.DISPOSITION,
    tags: ['buyers', 'networking', 'disposition', 'list-building'],
    timestamps: [
      { time: 0, label: 'Why Buyers Lists Matter', topic: 'importance' },
      { time: 180, label: 'Finding Cash Buyers', topic: 'sourcing' },
      { time: 420, label: 'Qualifying Your Buyers', topic: 'qualification' },
      { time: 660, label: 'Building Relationships', topic: 'relationships' },
      { time: 900, label: 'Segmenting Your List', topic: 'segmentation' },
    ],
    relatedStrategies: ['disposition', 'networking'],
  },
  {
    id: 'lesson-009',
    title: 'Assignment Contract Essentials',
    description:
      'Master the assignment contract - understand key clauses, protect yourself, and close deals smoothly.',
    videoUrl: '/videos/assignment-contracts.mp4',
    thumbnailUrl: '/thumbnails/assignment-contracts.jpg',
    duration: 950,
    category: LessonCategory.CONTRACTS,
    tags: ['contracts', 'assignment', 'legal', 'clauses'],
    timestamps: [
      { time: 0, label: 'Assignment Basics', topic: 'basics' },
      { time: 150, label: 'Key Contract Clauses', topic: 'clauses' },
      { time: 360, label: 'Assignability Language', topic: 'assignability' },
      { time: 540, label: 'Earnest Money Protection', topic: 'earnest-money' },
      { time: 720, label: 'Inspection Contingencies', topic: 'contingencies' },
      { time: 850, label: 'Common Mistakes', topic: 'mistakes' },
    ],
    relatedStrategies: ['assignment', 'contracts'],
  },
];

export async function GET() {
  const response: LessonsResponse = {
    lessons: mockLessons,
  };

  return NextResponse.json(response);
}
