
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
 