
// ===========================
// SHORT-FORM CAROUSEL FUNCTIONALITY - FIXED
// ===========================

(function() {
    'use strict';
    
    class ShortFormCarousel {
        constructor() {
            this.track = document.getElementById('shortformCarouselTrack');
            this.prevBtn = document.getElementById('shortformPrev');
            this.nextBtn = document.getElementById('shortformNext');
            this.dotsContainer = document.getElementById('shortformDots');
            
            if (!this.track || !this.prevBtn || !this.nextBtn) {
                console.warn('Carousel elements not found');
                return;
            }
            
            this.slides = Array.from(this.track.querySelectorAll('.shortform-carousel-slide'));
            this.totalSlides = this.slides.length;
            this.currentPage = 0;
            this.slidesPerPage = this.getSlidesPerPage();
            this.totalPages = Math.ceil(this.totalSlides / this.slidesPerPage);
            
            // Touch/drag variables
            this.isDragging = false;
            this.startPos = 0;
            this.currentTranslate = 0;
            this.prevTranslate = 0;
            
            this.init();
        }
        
        init() {
            this.createDots();
            this.updateCarousel();
            this.attachEventListeners();
            
            console.log(`✓ Carousel initialized: ${this.totalSlides} slides, ${this.slidesPerPage} per page, ${this.totalPages} pages`);
            
            // Recalculate on window resize
            window.addEventListener('resize', this.debounce(() => {
                const oldSlidesPerPage = this.slidesPerPage;
                this.slidesPerPage = this.getSlidesPerPage();
                
                if (oldSlidesPerPage !== this.slidesPerPage) {
                    this.totalPages = Math.ceil(this.totalSlides / this.slidesPerPage);
                    this.currentPage = 0; // Reset to first page on layout change
                    this.createDots();
                    this.updateCarousel();
                    console.log(`Layout changed: ${this.slidesPerPage} slides per page`);
                }
            }, 250));
        }
        
        getSlidesPerPage() {
            const width = window.innerWidth;
            if (width < 768) return 1;      // Mobile: 1 video
            if (width < 1024) return 2;     // Tablet: 2 videos
            return 3;                        // Desktop: 3 videos
        }
        
        createDots() {
            if (!this.dotsContainer) return;
            
            this.dotsContainer.innerHTML = '';
            
            for (let i = 0; i < this.totalPages; i++) {
                const dot = document.createElement('button');
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Go to page ${i + 1}`);
                dot.addEventListener('click', () => this.goToPage(i));
                this.dotsContainer.appendChild(dot);
            }
        }
        
        attachEventListeners() {
            // Navigation buttons
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
            
            // Touch/Mouse drag events
            this.track.addEventListener('mousedown', this.dragStart.bind(this));
            this.track.addEventListener('touchstart', this.dragStart.bind(this), { passive: true });
            
            this.track.addEventListener('mousemove', this.drag.bind(this));
            this.track.addEventListener('touchmove', this.drag.bind(this), { passive: false });
            
            this.track.addEventListener('mouseup', this.dragEnd.bind(this));
            this.track.addEventListener('touchend', this.dragEnd.bind(this));
            
            this.track.addEventListener('mouseleave', this.dragEnd.bind(this));
            
            // Prevent context menu on long press
            this.track.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (this.isCarouselInView()) {
                    if (e.key === 'ArrowLeft') this.prev();
                    if (e.key === 'ArrowRight') this.next();
                }
            });
        }
        
        isCarouselInView() {
            const rect = this.track.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }
        
        dragStart(e) {
            this.isDragging = true;
            this.startPos = this.getPositionX(e);
            this.prevTranslate = -this.currentPage * 100;
            this.track.style.transition = 'none';
        }
        
        drag(e) {
            if (!this.isDragging) return;
            
            const currentPosition = this.getPositionX(e);
            const containerWidth = this.track.parentElement.offsetWidth;
            const diff = currentPosition - this.startPos;
            const diffPercent = (diff / containerWidth) * 100;
            
            this.currentTranslate = this.prevTranslate + diffPercent;
            
            // Apply bounds
            const maxTranslate = 0;
            const minTranslate = -(this.totalPages - 1) * 100;
            this.currentTranslate = Math.max(minTranslate, Math.min(maxTranslate, this.currentTranslate));
            
            this.track.style.transform = `translateX(${this.currentTranslate}%)`;
            
            // Prevent default scrolling on touch devices
            if (e.type === 'touchmove') {
                e.preventDefault();
            }
        }
        
        dragEnd() {
            if (!this.isDragging) return;
            this.isDragging = false;
            
            const movedBy = this.currentTranslate - this.prevTranslate;
            const threshold = 10; // 10% movement threshold
            
            if (movedBy < -threshold && this.currentPage < this.totalPages - 1) {
                this.next();
            } else if (movedBy > threshold && this.currentPage > 0) {
                this.prev();
            } else {
                this.updateCarousel();
            }
        }
        
        getPositionX(e) {
            return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        }
        
        prev() {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.updateCarousel();
            }
        }
        
        next() {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.updateCarousel();
            }
        }
        
        goToPage(pageIndex) {
            this.currentPage = Math.max(0, Math.min(pageIndex, this.totalPages - 1));
            this.updateCarousel();
        }
        
        updateCarousel() {
            // Enable transition
            this.track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Calculate translate percentage
            const translateX = -this.currentPage * 100;
            this.track.style.transform = `translateX(${translateX}%)`;
            
            this.updateButtons();
            this.updateDots();
            this.muteNonVisibleVideos();
            
            console.log(`Current page: ${this.currentPage + 1}/${this.totalPages}`);
        }
        
        updateButtons() {
            // Disable/enable buttons based on position
            this.prevBtn.disabled = this.currentPage === 0;
            this.nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        }
        
        updateDots() {
            if (!this.dotsContainer) return;
            
            const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
            
            dots.forEach((dot, index) => {
                if (index === this.currentPage) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        muteNonVisibleVideos() {
            // Calculate which slides are visible
            const startIndex = this.currentPage * this.slidesPerPage;
            const endIndex = startIndex + this.slidesPerPage;
            
            this.slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                const button = slide.querySelector('.showcase-mute');
                
                if (!video) return;
                
                const isVisible = index >= startIndex && index < endIndex;
                
                if (!isVisible && !video.muted) {
                    video.muted = true;
                    
                    if (button) {
                        button.classList.remove('unmuted');
                        const icon = button.querySelector('.mute-icon');
                        if (icon) icon.textContent = '🔇';
                        button.setAttribute('aria-label', 'Unmute sound');
                    }
                }
            });
        }
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
    
    // Initialize carousel
    function initShortFormCarousel() {
        const showcasePage = document.getElementById('moreProjectsPage');
        
        if (!showcasePage) {
            console.log('Showcase page not found, waiting...');
            return null;
        }
        
        const carouselTrack = document.getElementById('shortformCarouselTrack');
        
        if (!carouselTrack) {
            console.log('Carousel track not found');
            return null;
        }
        
        // Create carousel instance
        return new ShortFormCarousel();
    }
    
    // Watch for showcase page opening
    function watchForShowcasePage() {
        const showcasePage = document.getElementById('moreProjectsPage');
        
        if (!showcasePage) {
            setTimeout(watchForShowcasePage, 500);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isActive = showcasePage.classList.contains('active');
                    
                    if (isActive && !window.shortFormCarouselInstance) {
                        console.log('Showcase page opened - initializing carousel');
                        setTimeout(() => {
                            window.shortFormCarouselInstance = initShortFormCarousel();
                        }, 400);
                    }
                }
            });
        });
        
        observer.observe(showcasePage, { attributes: true });
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.shortFormCarouselInstance = initShortFormCarousel();
            watchForShowcasePage();
        });
    } else {
        window.shortFormCarouselInstance = initShortFormCarousel();
        watchForShowcasePage();
    }
    
    // Also initialize when "Show More" is clicked
    window.addEventListener('load', () => {
        const showMoreBtn = document.getElementById('showMoreBtn');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (!window.shortFormCarouselInstance) {
                        console.log('Initializing carousel after Show More click');
                        window.shortFormCarouselInstance = initShortFormCarousel();
                    }
                }, 600);
            });
        }
    });
    
})(); 
        // ===========================
        // VIDEO PERFORMANCE OPTIMIZATION
        // ===========================
        (function() {
            const videoObserverOptions = {
                threshold: 0.25,
                rootMargin: '50px'
            };

            let activeVideos = new Set();
            const MAX_ACTIVE_VIDEOS = window.innerWidth < 768 ? 2 : 4;

            // Intersection Observer for lazy video playback
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    
                    if (entry.isIntersecting) {
                        // Video is visible
                        if (activeVideos.size < MAX_ACTIVE_VIDEOS) {
                            playVideoSafely(video);
                        }
                    } else {
                        // Video is not visible
                        pauseVideoSafely(video);
                    }
                });
            }, videoObserverOptions);

            function playVideoSafely(video) {
                if (video.paused && video.dataset.autoplay === 'true') {
                    video.play().catch(error => {
                        console.log('Video autoplay prevented:', error);
                    });
                    activeVideos.add(video);
                    
                    // Limit active videos
                    if (activeVideos.size > MAX_ACTIVE_VIDEOS) {
                        const oldestVideo = activeVideos.values().next().value;
                        pauseVideoSafely(oldestVideo);
                    }
                }
            }

            function pauseVideoSafely(video) {
                if (!video.paused) {
                    video.pause();
                    activeVideos.delete(video);
                }
            }

            // Initialize observer for all videos
            function initVideoOptimization() {
                const allVideos = document.querySelectorAll('video');
                
                allVideos.forEach(video => {
                    // Set loading attribute
                    video.setAttribute('loading', 'lazy');
                    
                    // Observe video
                    videoObserver.observe(video);
                    
                    // Pause initially if not in viewport
                    const rect = video.getBoundingClientRect();
                    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (!isInViewport) {
                        video.pause();
                    }
                });
            }

            // Pause all videos when page is hidden
            document.addEventListener('visibilitychange', () => {
                const allVideos = document.querySelectorAll('video');
                
                if (document.hidden) {
                    allVideos.forEach(video => pauseVideoSafely(video));
                } else {
                    // Resume only visible videos when page becomes visible
                    allVideos.forEach(video => {
                        const rect = video.getBoundingClientRect();
                        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                        
                        if (isInViewport && activeVideos.size < MAX_ACTIVE_VIDEOS) {
                            playVideoSafely(video);
                        }
                    });
                }
            });

            // Pause videos when modal/overlay is closed
            const moreProjectsPage = document.getElementById('moreProjectsPage');
            if (moreProjectsPage) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class') {
                            const isActive = moreProjectsPage.classList.contains('active');
                            const videos = moreProjectsPage.querySelectorAll('video');
                            
                            if (!isActive) {
                                videos.forEach(video => pauseVideoSafely(video));
                            } else {
                                setTimeout(() => {
                                    videos.forEach(video => {
                                        const rect = video.getBoundingClientRect();
                                        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                                        if (isInViewport) {
                                            playVideoSafely(video);
                                        }
                                    });
                                }, 300);
                            }
                        }
                    });
                });
                
                observer.observe(moreProjectsPage, { attributes: true });
            }

            // Memory cleanup on slider navigation
            function cleanupInactiveVideos() {
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(video => {
                    const rect = video.getBoundingClientRect();
                    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (!isInViewport) {
                        // Reduce memory usage by resetting video
                        if (!video.paused) {
                            video.pause();
                        }
                        if (video.currentTime > 0) {
                            video.currentTime = 0;
                        }
                        activeVideos.delete(video);
                    }
                });
            }

            // Throttled scroll handler for cleanup
            let cleanupTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(cleanupTimeout);
                cleanupTimeout = setTimeout(cleanupInactiveVideos, 500);
            }, { passive: true });

            // Initialize on DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initVideoOptimization);
            } else {
                initVideoOptimization();
            }

            // Re-initialize after dynamic content loads
            window.addEventListener('load', () => {
                setTimeout(initVideoOptimization, 1000);
            });
        })();

        // ===========================
        // SHORT-FORM VIDEOS SLIDER FUNCTIONALITY
        // ===========================
        let currentShortformSlide = 0;
        const totalShortformSlides = 3;
        let shortformStartX = 0;
        let shortformCurrentTranslate = 0;
        let shortformPrevTranslate = 0;
        let shortformIsDragging = false;

        const shortformSlider = document.getElementById('shortformSlider');
        const shortformDots = document.querySelectorAll('.shortform-dot');

        // ===========================
// VIDEO MUTE/UNMUTE TOGGLE FUNCTIONALITY (FIXED)
// ===========================

(function() {
    'use strict';
    
    /**
     * Initialize mute toggle functionality for all video mockups
     */
    function initMuteToggle() {
        const muteButtons = document.querySelectorAll('.mute-toggle');
        
        if (muteButtons.length === 0) {
            console.warn('No mute buttons found');
            return;
        }
        
        console.log(`Found ${muteButtons.length} mute buttons`);
        
        muteButtons.forEach(button => {
            const videoId = button.getAttribute('data-video-target');
            const video = document.querySelector(`video[data-video-id="${videoId}"]`);
            
            if (!video) {
                console.warn(`Video with ID "${videoId}" not found`);
                return;
            }
            
            console.log(`Linking button to video: ${videoId}`);
            
            // Remove any existing event listeners by cloning
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Set initial state (muted by default)
            updateButtonState(newButton, video);
            
            // Add click event listener
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent triggering video play/pause
                console.log(`Mute button clicked for: ${videoId}`);
                toggleMute(newButton, video);
            });
            
            // Also add touch event for mobile
            newButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Mute button touched for: ${videoId}`);
                toggleMute(newButton, video);
            });
        });
    }
    
    /**
     * Toggle mute/unmute state for a video
     * @param {HTMLElement} button - The mute toggle button
     * @param {HTMLVideoElement} video - The video element
     */
    function toggleMute(button, video) {
        console.log(`Current muted state: ${video.muted}`);
        
        if (video.muted) {
            // Unmute the video
            video.muted = false;
            video.volume = 1.0; // Ensure volume is at max
            button.classList.add('unmuted');
            button.querySelector('.mute-icon').textContent = '🔊';
            button.setAttribute('aria-label', 'Mute sound');
            
            console.log('Video unmuted');
            
            // Ensure video is playing
            if (video.paused) {
                video.play().catch(err => {
                    console.error('Video play failed:', err);
                });
            }
        } else {
            // Mute the video
            video.muted = true;
            button.classList.remove('unmuted');
            button.querySelector('.mute-icon').textContent = '🔇';
            button.setAttribute('aria-label', 'Unmute sound');
            
            console.log('Video muted');
        }
    }
    
    // ===========================
// SHOWCASE PAGE MUTE/UNMUTE TOGGLE
// ===========================

(function() {
    'use strict';
    
    /**
     * Initialize mute toggle for showcase page videos
     */
    function initShowcaseMuteToggle() {
        const showcasePage = document.getElementById('moreProjectsPage');
        
        if (!showcasePage) {
            console.log('Showcase page not found');
            return;
        }
        
        // Get all mute buttons in the showcase page
        const muteButtons = showcasePage.querySelectorAll('.showcase-mute');
        
        if (muteButtons.length === 0) {
            console.warn('No showcase mute buttons found');
            return;
        }
        
        console.log(`Found ${muteButtons.length} showcase mute buttons`);
        
        muteButtons.forEach(button => {
            const videoId = button.getAttribute('data-video-target');
            const video = showcasePage.querySelector(`video[data-video-id="${videoId}"]`);
            
            if (!video) {
                console.warn(`Showcase video with ID "${videoId}" not found`);
                return;
            }
            
            console.log(`Linking showcase button to video: ${videoId}`);
            
            // Set initial state (muted)
            updateShowcaseButtonState(button, video);
            
            // Remove existing listeners and add new one
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Click event
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Showcase mute button clicked: ${videoId}`);
                toggleShowcaseMute(newButton, video);
            });
            
            // Touch event for mobile
            newButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleShowcaseMute(newButton, video);
            });
        });
    }
    
    /**
     * Toggle mute state for showcase video
     */
    function toggleShowcaseMute(button, video) {
        console.log(`Toggling showcase video - Current muted: ${video.muted}`);
        
        if (video.muted) {
            // Unmute
            video.muted = false;
            video.volume = 1.0;
            button.classList.add('unmuted');
            button.querySelector('.mute-icon').textContent = '🔊';
            button.setAttribute('aria-label', 'Mute sound');
            
            console.log('Showcase video unmuted');
            
            // Ensure playing
            if (video.paused) {
                video.play().catch(err => {
                    console.error('Showcase video play failed:', err);
                });
            }
        } else {
            // Mute
            video.muted = true;
            button.classList.remove('unmuted');
            button.querySelector('.mute-icon').textContent = '🔇';
            button.setAttribute('aria-label', 'Unmute sound');
            
            console.log('Showcase video muted');
        }
    }
    
    /**
     * Update button state based on video mute status
     */
    function updateShowcaseButtonState(button, video) {
        const icon = button.querySelector('.mute-icon');
        
        if (!icon) {
            console.warn('Mute icon not found in showcase button');
            return;
        }
        
        if (video.muted) {
            button.classList.remove('unmuted');
            icon.textContent = '🔇';
            button.setAttribute('aria-label', 'Unmute sound');
        } else {
            button.classList.add('unmuted');
            icon.textContent = '🔊';
            button.setAttribute('aria-label', 'Mute sound');
        }
    }
    
    /**
     * Mute all showcase videos when page closes
     */
    function muteAllShowcaseVideos() {
        const showcasePage = document.getElementById('moreProjectsPage');
        if (!showcasePage) return;
        
        const videos = showcasePage.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.muted) {
                video.muted = true;
                
                // Update button
                const videoId = video.getAttribute('data-video-id');
                const button = showcasePage.querySelector(`.showcase-mute[data-video-target="${videoId}"]`);
                if (button) {
                    updateShowcaseButtonState(button, video);
                }
            }
        });
    }
    
    /**
     * Watch for showcase page open/close
     */
    function watchShowcasePage() {
        const showcasePage = document.getElementById('moreProjectsPage');
        if (!showcasePage) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isActive = showcasePage.classList.contains('active');
                    
                    if (isActive) {
                        // Page opened - reinitialize buttons
                        console.log('Showcase page opened - initializing mute buttons');
                        setTimeout(() => {
                            initShowcaseMuteToggle();
                        }, 500);
                    } else {
                        // Page closed - mute all videos
                        console.log('Showcase page closed - muting all videos');
                        muteAllShowcaseVideos();
                    }
                }
            });
        });
        
        observer.observe(showcasePage, { attributes: true });
    }
    
    /**
     * Handle shortform slider navigation - mute non-visible videos
     */
    function handleShortformSliderMute() {
        const originalGoToShortformSlide = window.goToShortformSlide;
        
        if (typeof originalGoToShortformSlide === 'function') {
            window.goToShortformSlide = function(slideIndex) {
                // Call original function
                originalGoToShortformSlide(slideIndex);
                
                // Mute all shortform videos after slide change
                setTimeout(() => {
                    const showcasePage = document.getElementById('moreProjectsPage');
                    if (!showcasePage) return;
                    
                    const shortformVideos = showcasePage.querySelectorAll('[data-video-id*="short"][data-video-id*="mobile"]');
                    shortformVideos.forEach(video => {
                        if (!video.muted) {
                            video.muted = true;
                            
                            const videoId = video.getAttribute('data-video-id');
                            const button = showcasePage.querySelector(`.showcase-mute[data-video-target="${videoId}"]`);
                            if (button) {
                                updateShowcaseButtonState(button, video);
                            }
                        }
                    });
                }, 100);
            };
        }
    }
    
    /**
     * Initialize everything
     */
    function init() {
        console.log('Initializing showcase page mute toggle...');
        
        setTimeout(() => {
            initShowcaseMuteToggle();
            watchShowcasePage();
            handleShortformSliderMute();
            console.log('✓ Showcase page mute toggle initialized');
        }, 500);
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Re-initialize after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('Re-initializing showcase mute after page load...');
            initShowcaseMuteToggle();
            watchShowcasePage();
        }, 1000);
    });
    
    // Also reinitialize when "Show More" button is clicked
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            setTimeout(() => {
                console.log('Show More clicked - initializing showcase mute buttons');
                initShowcaseMuteToggle();
            }, 600);
        });
    }
    
})();        

    /**
     * Update button appearance based on video mute state
     * @param {HTMLElement} button - The mute toggle button
     * @param {HTMLVideoElement} video - The video element
     */
    function updateButtonState(button, video) {
        const icon = button.querySelector('.mute-icon');
        
        if (!icon) {
            console.warn('Mute icon not found in button');
            return;
        }
        
        if (video.muted) {
            button.classList.remove('unmuted');
            icon.textContent = '🔇';
            button.setAttribute('aria-label', 'Unmute sound');
        } else {
            button.classList.add('unmuted');
            icon.textContent = '🔊';
            button.setAttribute('aria-label', 'Mute sound');
        }
    }
    
    /**
     * Initialize on DOM ready
     */
    function init() {
        console.log('Initializing mute toggle...');
        
        // Wait a bit for videos to be ready
        setTimeout(() => {
            initMuteToggle();
            console.log('✓ Video mute toggle initialized');
        }, 500);
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also try again after full page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('Re-initializing after page load...');
            initMuteToggle();
        }, 1000);
    });
    
})();

        // Update slider position and dots
        function updateShortformSlider() {
            const translateX = currentShortformSlide * -100;
            if (shortformSlider) {
                shortformSlider.style.transform = `translateX(${translateX}%)`;
            }
            
            // Update dots
            shortformDots.forEach((dot, index) => {
                if (index === currentShortformSlide) {
                    dot.style.backgroundColor = '#00ff88';
                } else {
                    dot.style.backgroundColor = '#6b7280';
                }
            });
        }
        
        // Go to specific slide
        function goToShortformSlide(slideIndex) {
            currentShortformSlide = slideIndex;
            updateShortformSlider();
        }

        // Touch events for mobile sliding
        if (shortformSlider) {
            // Touch start
            shortformSlider.addEventListener('touchstart', shortformTouchStart);
            shortformSlider.addEventListener('mousedown', shortformTouchStart);

            // Touch move
            shortformSlider.addEventListener('touchmove', shortformTouchMove);
            shortformSlider.addEventListener('mousemove', shortformTouchMove);

            // Touch end
            shortformSlider.addEventListener('touchend', shortformTouchEnd);
            shortformSlider.addEventListener('mouseup', shortformTouchEnd);
            shortformSlider.addEventListener('mouseleave', shortformTouchEnd);

            // Prevent context menu
            shortformSlider.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        function shortformTouchStart(event) {
            shortformIsDragging = true;
            shortformStartX = shortformGetPositionX(event);
            shortformPrevTranslate = currentShortformSlide * -100;
            
            if (shortformSlider) {
                shortformSlider.style.transition = 'none';
            }
        }

        function shortformTouchMove(event) {
            if (!shortformIsDragging) return;
            
            const currentX = shortformGetPositionX(event);
            const diffX = currentX - shortformStartX;
            const translatePercent = (diffX / shortformSlider.offsetWidth) * 100;
            shortformCurrentTranslate = shortformPrevTranslate + translatePercent;
            
            // Limit translation
            const maxTranslate = 0;
            const minTranslate = -(totalShortformSlides - 1) * 100;
            shortformCurrentTranslate = Math.max(minTranslate, Math.min(maxTranslate, shortformCurrentTranslate));
            
            if (shortformSlider) {
                shortformSlider.style.transform = `translateX(${shortformCurrentTranslate}%)`;
            }
        }

        function shortformTouchEnd() {
            if (!shortformIsDragging) return;
            shortformIsDragging = false;
            
            const movedBy = shortformCurrentTranslate - shortformPrevTranslate;
            
            // If moved enough, go to next/prev slide
            if (Math.abs(movedBy) > 20) {
                if (movedBy < 0 && currentShortformSlide < totalShortformSlides - 1) {
                    currentShortformSlide++;
                } else if (movedBy > 0 && currentShortformSlide > 0) {
                    currentShortformSlide--;
                }
            }
            
            // Re-enable transitions
            if (shortformSlider) {
                shortformSlider.style.transition = 'transform 0.3s ease-in-out';
            }
            
            updateShortformSlider();
        }

        function shortformGetPositionX(event) {
            return event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
        }

        // Initialize slider on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Only initialize if we're on mobile/tablet
            if (window.innerWidth < 1024 && shortformSlider) {
                updateShortformSlider();
            }
        });

        // Update slider on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth < 1024 && shortformSlider) {
                updateShortformSlider();
            }
        });

        // ===========================
        // PORTFOLIO SHOWCASE FUNCTIONALITY
        // ===========================
        
        // Video click to play/pause functionality
        document.querySelectorAll('.video-container').forEach(container => {
            const video = container.querySelector('.showcase-video');
            
            container.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });

            // Auto-pause on mobile for better performance
            if (window.innerWidth < 768) {
                video.autoplay = false;
                video.pause();
            }
        });

        // Before/After Slider functionality
        function initBeforeAfterSlider(containerSelector, sliderSelector) {
            const container = document.querySelector(containerSelector);
            const slider = document.querySelector(sliderSelector);
            
            if (!container || !slider) return;
            
            const afterImage = container.querySelector('.after-image');
            let isDragging = false;
            
            function updateSlider(percentage) {
                // Clamp percentage between 0 and 100
                percentage = Math.max(0, Math.min(100, percentage));
                
                // Update slider position
                slider.style.left = percentage + '%';
                
                // Update after image clip-path
                afterImage.style.clipPath = `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`;
            }
            
            function getPercentage(clientX) {
                const rect = container.getBoundingClientRect();
                return ((clientX - rect.left) / rect.width) * 100;
            }
            
            // Mouse events
            slider.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                updateSlider(getPercentage(e.clientX));
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            // Touch events for mobile
            slider.addEventListener('touchstart', (e) => {
                isDragging = true;
                e.preventDefault();
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                updateSlider(getPercentage(touch.clientX));
                e.preventDefault();
            });
            
            document.addEventListener('touchend', () => {
                isDragging = false;
            });
            
            // Click anywhere on container to move slider
            container.addEventListener('click', (e) => {
                if (e.target === slider || slider.contains(e.target)) return;
                updateSlider(getPercentage(e.clientX));
            });
        }
        
        // Initialize sliders when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            initBeforeAfterSlider('#beforeAfter1', '#slider1');
            initBeforeAfterSlider('#beforeAfter2', '#slider2');
            
            // Initialize videos based on screen size
            if (window.innerWidth >= 768) {
                document.querySelectorAll('.showcase-video').forEach(video => {
                    video.autoplay = true;
                    video.play().catch(() => {
                        // Autoplay failed, which is fine
                    });
                });
            }
        });

        // ===========================
        // MOBILE PHONE SLIDER FUNCTIONALITY
        // ===========================
        let currentSlide = 0;
        const totalSlides = 3;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationID = 0;
        let isDragging = false;

        const slider = document.getElementById('phoneSlider');
        const dots = document.querySelectorAll('.slider-dot');

        // Update slider position and dots
        function updateSlider() {
            const translateX = currentSlide * -100;
            if (slider) {
                slider.style.transform = `translateX(${translateX}%)`;
            }
            
            // Update dots
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.style.backgroundColor = '#00ff88';
                } else {
                    dot.style.backgroundColor = '#6b7280';
                }
            });
        }

        // Go to specific slide
        function goToSlide(slideIndex) {
            currentSlide = slideIndex;
            updateSlider();
        }

        // Touch events for mobile sliding
        if (slider) {
            // Touch start
            slider.addEventListener('touchstart', touchStart);
            slider.addEventListener('mousedown', touchStart);

            // Touch move
            slider.addEventListener('touchmove', touchMove);
            slider.addEventListener('mousemove', touchMove);

            // Touch end
            slider.addEventListener('touchend', touchEnd);
            slider.addEventListener('mouseup', touchEnd);
            slider.addEventListener('mouseleave', touchEnd);

            // Prevent context menu
            slider.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        function touchStart(event) {
            isDragging = true;
            startX = getPositionX(event);
            prevTranslate = currentSlide * -100;
            
            // Stop any ongoing animation
            cancelAnimationFrame(animationID);
            
            if (slider) {
                slider.style.transition = 'none';
            }
        }

        function touchMove(event) {
            if (!isDragging) return;
            
            const currentX = getPositionX(event);
            const diffX = currentX - startX;
            const translatePercent = (diffX / slider.offsetWidth) * 100;
            currentTranslate = prevTranslate + translatePercent;
            
            // Limit translation
            const maxTranslate = 0;
            const minTranslate = -(totalSlides - 1) * 100;
            currentTranslate = Math.max(minTranslate, Math.min(maxTranslate, currentTranslate));
            
            if (slider) {
                slider.style.transform = `translateX(${currentTranslate}%)`;
            }
        }

        function touchEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            const movedBy = currentTranslate - prevTranslate;
            
            // If moved enough, go to next/prev slide
            if (Math.abs(movedBy) > 20) {
                if (movedBy < 0 && currentSlide < totalSlides - 1) {
                    currentSlide++;
                } else if (movedBy > 0 && currentSlide > 0) {
                    currentSlide--;
                }
            }
            
            // Re-enable transitions
            if (slider) {
                slider.style.transition = 'transform 0.3s ease-in-out';
            }
            
            updateSlider();
        }

        function getPositionX(event) {
            return event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
        }

        // Initialize slider on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Only initialize if we're on mobile/tablet
            if (window.innerWidth < 1024) {
                updateSlider();
            }
        });

        // Update slider on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth < 1024) {
                updateSlider();
            }
        });

        // ===========================
        // FAQ ACCORDION FUNCTIONALITY
        // ===========================
        function toggleFAQ(button) {
            const faqItem = button.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // If the clicked item wasn't active, open it
            if (!isActive) {
                faqItem.classList.add('active');
            }
        }

        // ===========================
        // MOBILE MENU FUNCTIONALITY
        // ===========================
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const navLinks = document.getElementById('navLinks');
        const menuIcon = document.getElementById('menuIcon');

        function toggleMenu() {
            navLinks.classList.toggle('active');
            menuIcon.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';
        }

        function closeMenu() {
            navLinks.classList.remove('active');
            menuIcon.textContent = '☰';
            document.body.style.overflow = 'auto';
        }

        mobileMenuButton.addEventListener('click', toggleMenu);

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav') && navLinks.classList.contains('active')) {
                closeMenu();
            }
        });

        // ===========================
        // NAVBAR SCROLL EFFECTS
        // ===========================
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // ===========================
        // SMOOTH SCROLLING FOR ANCHOR LINKS
        // ===========================
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // ===========================
        // VIDEO CLICK TO PLAY/PAUSE
        // ===========================
        document.querySelectorAll('.video-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
                const video = content.querySelector('.video-element');
                if (video) {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                }
            });
        });

        // ===========================
        // INTERSECTION OBSERVER FOR ANIMATIONS
        // ===========================
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // ===========================
        // OBSERVE ELEMENTS FOR SCROLL ANIMATIONS
        // ===========================
        document.querySelectorAll('.phone-mockup, .process-card').forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(50px)';
            element.style.transition = `all 0.8s ease ${index * 0.2}s`;
            observer.observe(element);
        });

        // ===========================
        // SUBTLE PARALLAX EFFECT FOR PHONES (DISABLED ON MOBILE)
        // ===========================
        if (window.innerWidth > 768) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const phones = document.querySelectorAll('.phone-mockup');
                
                phones.forEach((phone, index) => {
                    const rate = scrolled * -0.02 * (index + 1);
                    phone.style.transform = `translateY(${rate}px)`;
                });
            });
        }

        // ===========================
        // SHOW MORE PAGE FUNCTIONALITY
        // ===========================
        const showMoreBtn = document.getElementById('showMoreBtn');
        const moreProjectsPage = document.getElementById('moreProjectsPage');
        const backButton = document.getElementById('backButton');

        // Show more projects page
        showMoreBtn.addEventListener('click', () => {
            moreProjectsPage.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Go back to main portfolio
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            moreProjectsPage.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Close page with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && moreProjectsPage.classList.contains('active')) {
                moreProjectsPage.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            // Ensure all videos are muted and autoplay
            document.querySelectorAll('video').forEach(video => {
                video.muted = true;
                video.autoplay = true;
                video.loop = true;
                video.play().catch(e => {
                    console.log('Autoplay prevented:', e);
                });
            });
        });

        // ===========================
        // RESPONSIVE FONT SIZING
        // ===========================
        function adjustFontSizes() {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                document.documentElement.style.fontSize = '14px';
            } else {
                document.documentElement.style.fontSize = '16px';
            }
        }

        window.addEventListener('resize', adjustFontSizes);
        adjustFontSizes();
 
        // ===========================
// SCROLL TO TOP BUTTON
// ===========================

(function() {
    'use strict';
    
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (!scrollToTopBtn) return;
    
    // Show/hide button based on scroll position
    function toggleScrollButton() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }
    
    // Smooth scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Event listeners
    window.addEventListener('scroll', toggleScrollButton);
    scrollToTopBtn.addEventListener('click', scrollToTop);
    
    // Initial check
    toggleScrollButton();
})();