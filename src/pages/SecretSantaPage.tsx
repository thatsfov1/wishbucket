import ComingSoon from '../components/ComingSoon';

export default function SecretSantaPage() {
  return (
    <ComingSoon
      title="Secret Santa"
      icon="🎄"
      description="Organize Secret Santa events with friends and family. Draw names, set budgets, and share wishlists!"
      features={[
        "Create Secret Santa groups",
        "Automatic name drawing",
        "Budget settings",
        "Anonymous wishlist sharing",
      ]}
    />
  );
}
