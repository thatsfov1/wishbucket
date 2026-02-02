import ComingSoon from '../components/ComingSoon';

export default function InspirationPage() {
  return (
    <ComingSoon
      title="Inspiration"
      icon="✨"
      description="Discover trending gift ideas and get inspired by what others are wishing for!"
      features={[
        "Trending gift ideas",
        "Category browsing",
        "Popularity rankings",
        "One-click add to wishlist",
      ]}
    />
  );
}
