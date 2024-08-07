

import { ref, watch, onMounted } from 'vue';

export function useReviews(businessId) {
  const reviews = ref([]);
  const error = ref(null);

  // Function to fetch reviews
  const fetchReviews = async () => {
    if (!businessId.value) {
      console.warn('No business ID available.');
      return;
    }

    console.log('Fetching reviews for Business ID:', businessId.value);

    try {
      const response = await fetch(`http://localhost:4444/api/v1.0.0/business/${businessId.value}/reviews`);
      const data = await response.json();

      console.log('API Response:', data);

      if (data.isSuccess) {
        reviews.value = data.data.map(review => ({
          ...review,
          reviewer: review.reviewer || { username: 'Anonymous' }
        }));
      } else {
        console.error('Failed to fetch reviews:', data.message);
        error.value = data.message;
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      error.value = err.message;
    }
  };

  onMounted(() => {
    fetchReviews();
  });

  watch(businessId, fetchReviews, { immediate: true });

  return {
    reviews,
    fetchReviews,  // Return fetchReviews as a function
    error
  };
}
