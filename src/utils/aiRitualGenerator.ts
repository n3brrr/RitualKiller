
export const generateRitualSuggestions = async (goal: string) => {
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock response based on simple keywords
  const title = goal.length > 10 ? goal.substring(0, 20) + "..." : goal;
  
  return [
    {
      title: `Protocol: ${title}`,
      description: `Daily rigorous training focused on ${goal}. No excuses.`,
      difficulty: 'adept',
    },
    {
      title: `Path of the ${title}`,
      description: `Small consistent steps towards ${goal}.`,
      difficulty: 'novice',
    },
    {
      title: `Mastery of ${title}`,
      description: `Extreme immersion in ${goal}. Sufffering is guaranteed.`,
      difficulty: 'master',
    }
  ];
};
