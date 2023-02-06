function setSlider(){
	
	$(".slider").each( function(){
		
		var $slider = $(this),
				$itemscontainer = $slider.find(".slider-items-container");
		
		if ($itemscontainer.find(".slider-item.active").length == 0){
			$itemscontainer.find(".slider-item").first().addClass("active");
		}
		
		function setWidth(){
			var totalWidth = 0
			
			$($itemscontainer).find(".slider-item").each( function(){
				totalWidth += $(this).outerWidth();
			});
			
			$itemscontainer.width(totalWidth);
			
		}
		function setTransform(){
			
			var $activeItem = $itemscontainer.find(".slider-item.active"),
					activeItemOffset = $activeItem.offset().left,
					itemsContainerOffset = $itemscontainer.offset().left,
					totalOffset = activeItemOffset - itemsContainerOffset
			
			$itemscontainer.css({"transform": "translate( -"+totalOffset+"px, 0px)"})
			
		}
		function nextSlide(){
			var activeItem = $itemscontainer.find(".slider-item.active"),
					activeItemIndex = activeItem.index(),
					sliderItemTotal = $itemscontainer.find(".slider-item").length,
					nextSlide = 0;
			
			if (activeItemIndex + 1 > sliderItemTotal - 1){
				nextSlide = 0;
			}else{
				nextSlide = activeItemIndex + 1
			}
			
			var nextSlideSelect = $itemscontainer.find(".slider-item").eq(nextSlide),
					itemContainerOffset = $itemscontainer.offset().left,
					totalOffset = nextSlideSelect.offset().left - itemContainerOffset
			
			$itemscontainer.find(".slider-item.active").removeClass("active");
			nextSlideSelect.addClass("active");
			$slider.find(".dots").find(".dot").removeClass("active")
			$slider.find(".dots").find(".dot").eq(nextSlide).addClass("active");
			$itemscontainer.css({"transform": "translate( -"+totalOffset+"px, 0px)"})
			
		}
		function prevSlide(){
			var activeItem = $itemscontainer.find(".slider-item.active"),
					activeItemIndex = activeItem.index(),
					sliderItemTotal = $itemscontainer.find(".slider-item").length,
					nextSlide = 0;
			
			if (activeItemIndex - 1 < 0){
				nextSlide = sliderItemTotal - 1;
			}else{
				nextSlide = activeItemIndex - 1;
			}
			
			var nextSlideSelect = $itemscontainer.find(".slider-item").eq(nextSlide),
					itemContainerOffset = $itemscontainer.offset().left,
					totalOffset = nextSlideSelect.offset().left - itemContainerOffset
			
			$itemscontainer.find(".slider-item.active").removeClass("active");
			nextSlideSelect.addClass("active");
			$slider.find(".dots").find(".dot").removeClass("active")
			$slider.find(".dots").find(".dot").eq(nextSlide).addClass("active");
			$itemscontainer.css({"transform": "translate( -"+totalOffset+"px, 0px)"})
			
		}
		function makeDots(){
			var activeItem = $itemscontainer.find(".slider-item.active"),
					activeItemIndex = activeItem.index(),
					sliderItemTotal = $itemscontainer.find(".slider-item").length;
			
			for (i = 0; i < sliderItemTotal; i++){
				$slider.find(".dots").append("<div class='dot'></div>")
			}
			
			$slider.find(".dots").find(".dot").eq(activeItemIndex).addClass("active")
			
		}
		
		setWidth();
		setTransform();
		makeDots();
		
		$(window).resize( function(){
					setWidth();
					setTransform();
		});
		
		var nextBtn = $slider.find(".controls").find(".next-btn"),
				prevBtn = $slider.find(".controls").find(".prev-btn");
		
		nextBtn.on('click', function(e){
			e.preventDefault();
			nextSlide();
		});
		
		prevBtn.on('click', function(e){
			e.preventDefault();
			prevSlide();
		});
		
		$slider.find(".dots").find(".dot").on('click', function(e){
			
			var dotIndex = $(this).index(),
					totalOffset = $itemscontainer.find(".slider-item").eq(dotIndex).offset().left - $itemscontainer.offset().left;
					
			$itemscontainer.find(".slider-item.active").removeClass("active");
			$itemscontainer.find(".slider-item").eq(dotIndex).addClass("active");
			$slider.find(".dots").find(".dot").removeClass("active");
			$(this).addClass("active")
			
			$itemscontainer.css({"transform": "translate( -"+totalOffset+"px, 0px)"})
			
		});
		
	});
	
}

setSlider();