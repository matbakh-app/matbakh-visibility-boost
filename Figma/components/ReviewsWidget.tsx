import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ExternalLink, RotateCcw, Download, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { WidgetStateWrapper, SkeletonText, SkeletonCard, SkeletonList } from './WidgetStates';

const ReviewsWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const averageRating = 4.3;
  const totalReviews = 127;
  
  const recentReviews = [
    {
      id: 1,
      author: "Sarah M.",
      rating: 5,
      text: "Fantastisches Essen und ausgezeichneter Service! Kommen gerne wieder.",
      time: "vor 2 Stunden"
    },
    {
      id: 2,
      author: "Tom K.",
      rating: 4,
      text: "Sehr leckere Gerichte, aber etwas lange Wartezeit.",
      time: "vor 1 Tag"
    },
    {
      id: 3,
      author: "Lisa B.",
      rating: 5,
      text: "Beste Küche in der Gegend! Absolute Empfehlung.",
      time: "vor 2 Tagen"
    }
  ];

  // Simulate loading
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setIsError(false);
      
      setTimeout(() => {
        const random = Math.random();
        if (random < 0.1) {
          setIsError(true);
        } else if (random < 0.15) {
          setIsEmpty(true);
        } else {
          setIsEmpty(false);
        }
        setIsLoading(false);
      }, Math.random() * 2000 + 1000);
    };

    loadData();
  }, []);

  const handleRetry = () => {
    setIsError(false);
    setIsEmpty(false);
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsEmpty(false);
    }, 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIsError(false);
    setIsEmpty(false);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? 'text-warning fill-warning'
            : i < rating
            ? 'text-warning fill-warning opacity-50'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const skeletonComponent = (
    <CardContent>
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-6">
        {/* Average Rating Skeleton */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 py-4 md:py-0">
          <div className="w-16 h-12 bg-muted rounded animate-pulse"></div>
          <div className="flex space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="w-4 h-4 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
          <SkeletonText lines={2} width="half" />
        </div>

        {/* Reviews Skeleton */}
        <div className="space-y-3">
          <div className="w-32 h-4 bg-muted rounded animate-pulse"></div>
          <SkeletonList items={2} />
        </div>
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-card shadow-sm border border-border widget-card">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg text-foreground">Google Business Reviews</CardTitle>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button 
              className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-accent button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
              onClick={(event) => {
                console.log('Exporting Reviews data...');
                event.currentTarget.classList.add('success-flash');
                setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
              }}
              title="Export Data"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 md:w-full md:h-full text-muted-foreground hover:text-primary transition-colors duration-150" />
            </button>
            <button 
              className={`w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-accent button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
              onClick={handleRefresh}
              title="Refresh Data"
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 md:w-full md:h-full text-muted-foreground hover:text-primary transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-success" disabled={isLoading}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Reviews verfügbar"
        emptyDescription="Warte auf erste Kundenbewertungen..."
        emptyIcon={Users}
      >
        <CardContent>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-6">
            {/* Average Rating Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4 md:py-0">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{averageRating}</div>
              <div className="flex items-center space-x-1">
                {renderStars(averageRating, "w-4 h-4 md:w-5 md:h-5")}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {totalReviews} Bewertungen
              </div>
              <div className="text-xs text-success bg-success-light px-2 py-1 rounded-full">
                +12 diese Woche
              </div>
            </div>

            {/* Recent Reviews Section */}
            <div className="space-y-3">
              <h4 className="text-sm md:font-medium text-foreground mb-3">Neueste Bewertungen</h4>
              {recentReviews.slice(0, 2).map((review) => (
                <div key={review.id} className="border-l-2 border-success pl-3 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5 md:w-6 md:h-6">
                        <AvatarFallback className="text-xs bg-muted">
                          {review.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs md:text-sm font-medium text-foreground">{review.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating, "w-2 h-2 md:w-3 md:h-3")}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{review.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-caption-foreground">{review.time}</span>
                    <button 
                      className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-xs px-3 py-1 rounded button-hover min-h-[44px] md:min-h-[24px] flex items-center justify-center"
                      style={{ width: '80px', height: '44px' }}
                      onClick={(event) => {
                        console.log(`Antworten auf Review von ${review.author}`);
                        event.currentTarget.classList.add('success-flash');
                        setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
                      }}
                    >
                      Antworten
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Mobile: Show more button for remaining review */}
              <div className="md:hidden">
                {recentReviews.length > 2 && (
                  <button 
                    className="w-full text-center text-xs text-primary hover:text-primary/80 py-2 border border-primary/20 rounded-md hover:bg-primary/5 transition-colors min-h-[44px] flex items-center justify-center"
                    onClick={() => console.log('Show more reviews')}
                  >
                    +{recentReviews.length - 2} weitere Reviews anzeigen
                  </button>
                )}
              </div>

              {/* Desktop: Show third review */}
              <div className="hidden md:block">
                {recentReviews.slice(2).map((review) => (
                  <div key={review.id} className="border-l-2 border-success pl-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-muted">
                            {review.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{review.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating, "w-3 h-3")}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{review.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-caption-foreground">{review.time}</span>
                      <button 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1 rounded transition-all duration-200 hover:shadow-md"
                        style={{ width: '80px', height: '24px' }}
                        onClick={() => console.log(`Antworten auf Review von ${review.author}`)}
                      >
                        Antworten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button className="w-full bg-success hover:bg-success/90 text-white button-hover" disabled={isLoading}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Alle Reviews verwalten
            </Button>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default ReviewsWidget;