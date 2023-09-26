$(document).ready(function () {
    var jsonPATH = 'http://www.aldevron.com/hubfs/aldevron_template/assets/banners.json?v=11',
        bannerMarkup = $('.aldevron-banners > .banner[data-banner_id=0]'),
        visibleOnCurrentPage = false
    ;

    console.log(hsVars.page_id);
    $.getJSON(jsonPATH, function (res) {
        var container = $('.aldevron-banners'),
            banners = res.banners,
            pageIDs = res.pages
        ;

        for (var x = 0; x < pageIDs.length; x++) {
            if (pageIDs[x] === hsVars.page_id) visibleOnCurrentPage = true;
        }

        console.log(hsVars.page_id);
        console.log(visibleOnCurrentPage);

        if (visibleOnCurrentPage === true) {
            for (var x = 0; x < banners.length; x++) {
                var banner = banners[x];
                if (banner.enabled === false || $.cookie('aldevron_banner_' + banner.id) == 'closed') continue;

                
                var newBanner = bannerMarkup.clone(true);
                newBanner.attr('data-banner_id', banner.id);
                if (typeof banner.url !== 'undefined') newBanner.find('a').attr('href', banner.url);
                if (typeof banner.message !== 'undefined') newBanner.find('.message').html(banner.message);
                if (typeof banner.background_color !== 'undefined') newBanner.css('background-color', banner.background_color);
                if (typeof banner.thumbnail_src !== 'undefined') newBanner.find('.thumbnail img').attr('src', banner.thumbnail_src);

                newBanner.addClass('visible');
                container.append(newBanner);
            }
            bannerMarkup.remove();
        }

        else $('.aldevron-banners').remove();
        
    });
    
    $('.aldevron-banners .close-button').on('click', function () {
        var parent = $(this).parents('.banner'),
            bannerID = parent.attr('data-banner_id')
        ;
        
        $.cookie('aldevron_banner_' + bannerID, 'closed', { expires: 14 });
        parent.removeClass('visible');
        return false;
    });
    
});