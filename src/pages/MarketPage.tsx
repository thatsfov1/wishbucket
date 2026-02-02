import ComingSoon from '../components/ComingSoon';

export default function MarketPage() {
  return (
    <ComingSoon
      title="Bonus Shop"
      icon="🛍️"
      description="Earn points by inviting friends and completing tasks. Redeem them for exclusive rewards!"
      features={[
        "Exclusive discounts & coupons",
        "Premium features unlock",
        "Partner brand rewards",
        "Limited-time offers",
      ]}
    />
  );
}
