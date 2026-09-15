export const getImageUrl = (data) => {
  if (!data?.publicId) return null;

  return `${import.meta.env.VITE_API}/api/${data.publicId} `;
};

