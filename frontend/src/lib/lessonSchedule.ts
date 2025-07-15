interface LessonPlanItem {
  id: string;
  title: string;
  completed: boolean;
  required: boolean;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  date: Date;
  progress: number;
  icon: string;
  color: string;
  buttonColor: string;
  plan: LessonPlanItem[];
  status?: 'normal' | 'skipped' | 'cancelled';
}

// Generate all lesson dates (Mondays and Tuesdays from July 1 - August 31, 2025)
const generateLessonDates = (): Date[] => {
  const dates: Date[] = [];
  const startDate = new Date(2025, 6, 1); // July 1, 2025
  const endDate = new Date(2025, 7, 31); // August 31, 2025
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 1 = Monday, 2 = Tuesday
    if (dayOfWeek === 1 || dayOfWeek === 2) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Lesson topics and content
const lessonTopics = [
  {
    name: "Introduction to Mobile App Development",
    description: "Understanding the fundamentals of mobile app development",
    icon: "fas fa-mobile-alt",
    color: "from-blue-500 to-purple-600",
    buttonColor: "text-blue-600 hover:text-blue-700",
    plan: [
      { id: '1', title: 'Mobile development landscape overview', completed: false, required: true },
      { id: '2', title: 'iOS vs Android development', completed: false, required: true },
      { id: '3', title: 'Development tools and environments', completed: false, required: true },
      { id: '4', title: 'App store guidelines', completed: false, required: false }
    ]
  },
  {
    name: "UI/UX Design Principles",
    description: "Learning effective user interface and experience design",
    icon: "fas fa-paint-brush",
    color: "from-purple-500 to-pink-600",
    buttonColor: "text-purple-600 hover:text-purple-700",
    plan: [
      { id: '1', title: 'Design thinking process', completed: false, required: true },
      { id: '2', title: 'User research methods', completed: false, required: true },
      { id: '3', title: 'Wireframing and prototyping', completed: false, required: true },
      { id: '4', title: 'Accessibility considerations', completed: false, required: false }
    ]
  },
  {
    name: "Swift Programming Fundamentals",
    description: "Master the basics of Swift programming language",
    icon: "fas fa-code",
    color: "from-orange-500 to-red-600",
    buttonColor: "text-orange-600 hover:text-orange-700",
    plan: [
      { id: '1', title: 'Variables and data types', completed: false, required: true },
      { id: '2', title: 'Control flow and functions', completed: false, required: true },
      { id: '3', title: 'Object-oriented programming', completed: false, required: true },
      { id: '4', title: 'Error handling and optionals', completed: false, required: false }
    ]
  },
  {
    name: "SwiftUI Basics",
    description: "Building user interfaces with SwiftUI framework",
    icon: "fas fa-layer-group",
    color: "from-green-500 to-teal-600",
    buttonColor: "text-green-600 hover:text-green-700",
    plan: [
      { id: '1', title: 'Views and modifiers', completed: false, required: true },
      { id: '2', title: 'State management', completed: false, required: true },
      { id: '3', title: 'Navigation and presentation', completed: false, required: true },
      { id: '4', title: 'Custom view components', completed: false, required: false }
    ]
  },
  {
    name: "Data Management",
    description: "Working with data in mobile applications",
    icon: "fas fa-database",
    color: "from-indigo-500 to-blue-600",
    buttonColor: "text-indigo-600 hover:text-indigo-700",
    plan: [
      { id: '1', title: 'Core Data fundamentals', completed: false, required: true },
      { id: '2', title: 'Network requests and APIs', completed: false, required: true },
      { id: '3', title: 'Data persistence strategies', completed: false, required: true },
      { id: '4', title: 'Caching and performance', completed: false, required: false }
    ]
  },
  {
    name: "App Architecture Patterns",
    description: "Understanding different architectural approaches",
    icon: "fas fa-sitemap",
    color: "from-cyan-500 to-blue-600",
    buttonColor: "text-cyan-600 hover:text-cyan-700",
    plan: [
      { id: '1', title: 'MVC vs MVVM patterns', completed: false, required: true },
      { id: '2', title: 'Dependency injection', completed: false, required: true },
      { id: '3', title: 'Clean architecture principles', completed: false, required: true },
      { id: '4', title: 'Testing strategies', completed: false, required: false }
    ]
  },
  {
    name: "Testing and Debugging",
    description: "Ensuring app quality through testing and debugging",
    icon: "fas fa-bug",
    color: "from-yellow-500 to-orange-600",
    buttonColor: "text-yellow-600 hover:text-yellow-700",
    plan: [
      { id: '1', title: 'Unit testing fundamentals', completed: false, required: true },
      { id: '2', title: 'UI testing with XCTest', completed: false, required: true },
      { id: '3', title: 'Debugging tools and techniques', completed: false, required: true },
      { id: '4', title: 'Performance profiling', completed: false, required: false }
    ]
  },
  {
    name: "App Store Deployment",
    description: "Publishing your app to the App Store",
    icon: "fas fa-rocket",
    color: "from-emerald-500 to-green-600",
    buttonColor: "text-emerald-600 hover:text-emerald-700",
    plan: [
      { id: '1', title: 'App Store Connect setup', completed: false, required: true },
      { id: '2', title: 'App review guidelines', completed: false, required: true },
      { id: '3', title: 'Metadata and screenshots', completed: false, required: true },
      { id: '4', title: 'App analytics and updates', completed: false, required: false }
    ]
  }
];

// Generate all lessons with dates
export const generateAllLessons = (): Lesson[] => {
  const dates = generateLessonDates();
  const lessons: Lesson[] = [];
  
  dates.forEach((date, index) => {
    const topicIndex = index % lessonTopics.length;
    const topic = lessonTopics[topicIndex];
    const lessonNumber = index + 1;
    
    // Mark Lesson 2 as skipped
    const status = lessonNumber === 2 ? 'skipped' : 'normal';
    
    lessons.push({
      id: `lesson-${lessonNumber}`,
      name: `Lesson ${lessonNumber}: ${topic.name}`,
      description: topic.description,
      date: date,
      progress: 0, // Will be calculated based on user activity
      icon: topic.icon,
      color: topic.color,
      buttonColor: topic.buttonColor,
      plan: topic.plan.map(item => ({ ...item })), // Deep copy
      status: status
    });
  });
  
  return lessons;
};

// Get the current or next lesson based on today's date (excluding skipped lessons)
export const getCurrentLesson = (): Lesson | null => {
  const lessons = generateAllLessons();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find the first lesson that is today or in the future and not skipped
  const currentLesson = lessons.find(lesson => {
    const lessonDate = new Date(lesson.date);
    lessonDate.setHours(0, 0, 0, 0);
    return lessonDate >= today && lesson.status !== 'skipped';
  });
  
  // If no current lesson found, return the last non-skipped lesson
  if (!currentLesson) {
    const nonSkippedLessons = lessons.filter(lesson => lesson.status !== 'skipped');
    return nonSkippedLessons[nonSkippedLessons.length - 1] || null;
  }
  
  return currentLesson;
};

// Get all lessons
export const getAllLessons = (): Lesson[] => {
  return generateAllLessons();
};

// Format date for display
export const formatLessonDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Check if a lesson date has passed
export const isLessonPast = (lessonDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lesson = new Date(lessonDate);
  lesson.setHours(0, 0, 0, 0);
  return lesson < today;
};

// Check if a lesson is today
export const isLessonToday = (lessonDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lesson = new Date(lessonDate);
  lesson.setHours(0, 0, 0, 0);
  return lesson.getTime() === today.getTime();
};