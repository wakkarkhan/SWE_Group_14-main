<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="p-3">
        <!-- Reviews Section -->
        <v-card class="pa-4">
          <v-card-title>
            <h4 class="text-center">Reviews</h4>
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item-group v-if="reviews.length">
                <!-- Dynamically render reviews -->
                <v-list-item v-for="review in reviews" :key="review._id">
                  <v-list-item-content>
                    <v-list-item-title>
                      <div class="review-rating">
                        <!-- Render stars based on the review rating -->
                        <span v-for="star in 5" :key="star" :class="{'filled': star <= review.rating, 'empty': star > review.rating}">
                          &#9733;
                        </span>
                      </div>
                      <p class="review-text">
                        {{ review.comment }}
                      </p>
                      <p class="review-username">
                        {{ review.reviewer?.username || 'Anonymous' }}
                      </p>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
              <!-- Message when no reviews are available -->
              <v-list-item v-else>
                <v-list-item-content>
                  <p>No reviews available.</p>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Review Submission Section -->
        <v-card class="pa-4 mt-4">
          <v-card-title>
            <h4 class="text-center">Write a Review</h4>
          </v-card-title>
          <v-card-subtitle class="text-center">Rating</v-card-subtitle>
          <v-card-text class="text-center">
            <div class="stars" @mouseover="showTooltip" @mouseleave="hideTooltip">
              <span 
                v-for="star in stars" 
                :key="star"
                :class="{'filled': star <= rating, 'empty': star > rating}"
                @click="setRating(star)"
                :data-star="star"
              >
                &#9733;
              </span>
              <div v-if="tooltipVisible" class="tooltip">{{ tooltipText }}</div>
            </div>
            <v-textarea 
              v-model="reviewText"
              rows="4" 
              placeholder="Write your review here..."
              class="mt-3"
            ></v-textarea>
            <v-row class="mt-4">
              <v-col class="d-flex justify-end">
                <v-btn color="primary" @click="submitReview">Submit</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import { useUserStore } from '@/store/user';
import { useReviews } from '@/composables/useReviews';

// Define props
const props = defineProps({
  business: Object
});

// Define reactive states
const rating = ref(0);
const stars = [1, 2, 3, 4, 5];
const tooltipVisible = ref(false);
const tooltipText = ref('');
const reviewText = ref('');
const shouldFetchReviews = ref(true); // Used to trigger fetching reviews

// Use Vue Router
const router = useRouter();

// Use the notification store
const notificationStore = useNotificationStore();

// Use the user store
const userStore = useUserStore();

// Use the reviews composable
const businessId = ref(props.business?._id);
const { reviews, fetchReviews } = useReviews(businessId);

// Watch for changes in props.business._id and update businessId accordingly
watch(() => props.business?._id, (newId) => {
  businessId.value = newId;
  shouldFetchReviews.value = true; // Trigger fetch reviews on businessId change
});

// Fetch reviews when component mounts or when shouldFetchReviews is true
onMounted(() => {
  if (shouldFetchReviews.value) {
    fetchReviews().then(() => {
      // notificationStore.showSuccess('Reviews loaded successfully.');
    }).catch(err => {
      notificationStore.showError(`Error fetching reviews: ${err.message}`);
    });
    shouldFetchReviews.value = false; // Reset after fetching
  }
});

watch(shouldFetchReviews, (newVal) => {
  if (newVal) {
    fetchReviews().then(() => {
      // notificationStore.showSuccess('Reviews reloaded successfully.');
    }).catch(err => {
      notificationStore.showError(`Error fetching reviews: ${err.message}`);
    });
    shouldFetchReviews.value = false;
  }
});

// Base URL from environment variables
const baseUrl = import.meta.env.VITE_API_ENDPOINT;

// Method to set the rating
function setRating(star) {
  rating.value = star;
}

// Method to show tooltip
function showTooltip(event) {
  tooltipVisible.value = true;
  const star = event.target.getAttribute('data-star');
  tooltipText.value = `${star} Star${star > 1 ? 's' : ''}`;
}

// Method to hide tooltip
function hideTooltip() {
  tooltipVisible.value = false;
}

// Method to submit the review
function submitReview() {
  if (rating.value === 0 || !reviewText.value.trim()) {
    notificationStore.showError('Please fill in both the rating and the comment before submitting.');
    return;
  }

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : {};
  const userId = user.id;

  if (!userId) {
    notificationStore.showError('Reviewer ID is not available. Please log in and try again.');
    return;
  }

  const reviewPayload = {
    reviewerId: userId,
    rating: rating.value,
    comment: reviewText.value
  };

  const businessId = props.business?._id;

  if (!businessId) {
    notificationStore.showError('Business ID is missing');
    return;
  }

  fetch(`${baseUrl}/business/${businessId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reviewPayload),
  })
    .then(response => response.json())
    .then(data => {
      if (data.isSuccess) {
        notificationStore.showSuccess('Your review has been submitted successfully.');
        reviewText.value = '';
        rating.value = 0;
        shouldFetchReviews.value = true; // Trigger reviews fetch
      } else if (data.message === 'You have already reviewed this business') {
        notificationStore.showError('You have already reviewed this business.');
      } else {
        throw new Error(`HTTP error! status: ${data.status}`);
      }
    })
    .catch(error => {
      console.error('Error submitting review:', error);
      notificationStore.showError('An error occurred while submitting your review.');
    });
}
</script>

<style scoped>
.v-container {
  padding: 11px; 
}

.stars {
  font-size: 30px;
  color: gold;
  cursor: pointer;
  display: inline-block;
  margin: 10px 0;
  position: relative;
}

.stars span {
  display: inline-block;
  padding: 0 8px;
}

.stars .filled {
  color: gold;
}

.stars .empty {
  color: lightgray;
}

.tooltip {
  position: absolute;
  background-color: #333;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.v-card--variant-elevated {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

.v-btn {
  font-weight: bold;
}

.review-rating {
  font-size: 18px;
  color: gold;
  margin-bottom: 10px;
}

.review-rating .filled {
  color: gold;
}

.review-rating .empty {
  color: lightgray;
}

.review-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.review-username {
  margin: 0;
  font-size: 12px;
  color: gray;
  font-style: italic;
}
</style>
