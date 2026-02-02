import ComingSoon from '../components/ComingSoon';

export default function FindGiftPage() {
  return (
    <ComingSoon
      title="Find Gift"
      icon="🎁"
      description="Let us help you find the perfect gift! Answer a few questions and get personalized suggestions."
      features={[
        "AI-powered gift recommendations",
        "Budget-friendly options",
        "Personalized suggestions based on interests",
        "Direct add to wishlist",
      ]}
    />
  );
}
