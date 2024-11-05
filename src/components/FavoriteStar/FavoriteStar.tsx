import { FaStar } from "react-icons/fa";

export default function FavoriteStar({ isFavorite }: { isFavorite?: boolean }) {
  return isFavorite ? (
    <FaStar className="text-[14px] text-[#E1E1F5]" />
  ) : (
    <FaStar className="text-[14px] text-[#454552]" />
  );
}
