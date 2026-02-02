import ComingSoon from '../components/ComingSoon';

export default function CrowdfundingPage() {
  return (
    <ComingSoon
      title="Crowdfunding"
      icon="💰"
      description="Pool money with friends to buy expensive gifts together. Perfect for big-ticket items!"
      features={[
        "Create crowdfunding campaigns",
        "Invite contributors",
        "Track progress in real-time",
        "Secure payment handling",
      ]}
    />
  );
}
