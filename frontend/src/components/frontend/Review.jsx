import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

function Review({
  rating = 4.5,
  total = 5,
  size = 16,
  showValue = true,
}) {
  const safeRating = Number(rating) || 0;
  const stars = [];

  for (let i = 1; i <= total; i++) {
    if (safeRating >= i) {
      stars.push(<FaStar key={i} size={size} className="text-yellow-400" />);
    } else if (safeRating >= i - 0.5) {
      stars.push(
        <FaStarHalfAlt key={i} size={size} className="text-yellow-400" />
      );
    } else {
      stars.push(<FaRegStar key={i} size={size} className="text-gray-300" />);
    }
  }

  return (
    <>
      {safeRating != 0 &&
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">{stars}</div>

          {showValue && (
            <span className="text-xs text-gray-600 font-medium">
              {safeRating.toFixed(1)} / {total}
            </span>
          )}
        </div>
      }
    </>
  );
}

export default Review;
