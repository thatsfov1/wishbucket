import ComingSoon from '../components/ComingSoon';

export default function TasksPage() {
  return (
    <ComingSoon
      title="Tasks & Rewards"
      icon="🎯"
      description="Complete simple tasks to earn bonus points. Invite friends, follow channels, and more!"
      features={[
        "Daily tasks & challenges",
        "Referral bonuses",
        "Social media rewards",
        "Milestone achievements",
      ]}
    />
  );
}
