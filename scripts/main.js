;(function() {
  var load_max = 500;
  var cur_load_num = 0;
  var img_data = null;
  var img_comment_data = null;
  var cur_pic_id = 0;
  var currentPos = null;
  var cur_page = 0;

  //Elements
  var next_btn = $('#next-page');
  var prev_btn = $('#prev-page');
  var show_pic = $("#show-pic");
  var comments = $('#comments');

  var degreesToRadians = function (degrees) {
    return (degrees * Math.PI) / 180;
  };

  var getDistance = function(slat, slon) {
    if (currentPos == null) {
      return;
    }
    var startLatRads = degreesToRadians(slat);
    var startLongRads = degreesToRadians(slon);
    var destLatRads = degreesToRadians(currentPos.coords.latitude);
    var destLongRads = degreesToRadians(currentPos.coords.longitude);

    var Radius = 6371.0;
    return Math.round(Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) +
      Math.cos(startLatRads) * Math.cos(destLatRads) *
      Math.cos(startLongRads - destLongRads)) * Radius);
  };

  var clickClose = function() {
    document.body.parentNode.style.overflowY="scroll";
    show_pic.hide();
    prev_btn.unbind();
    next_btn.unbind();
    $('#pic').attr('src', 'assets/loading.png');
  };

  var showComment = function(id, page) {//Show comment by page
    comments.html('<p>Loading...</p>');
    $.getJSON('./assets/img_comments/' + id % 6 + '_' + page + '.json', function(data) {
      comments.html("");
      for (var x = 0; x < data.length; x++) {
        var newComment = document.createElement('div');
        newComment.setAttribute('class', 'comment');
        newComment.innerHTML = '<h4>' + data[x].name + '</h4><p>' + data[x].content +'</p><hr/>';
        comments.append(newComment);
      }
    });
  };

  var clickPage = function(id, page) {
    var title = $('#comment-title');
    showComment(id, page);
    title.html('Page ' + (page + 1) + '/' + img_comment_data.num_pages);

    if (page > 0)
      prev_btn.attr('disabled', false);
    else
      prev_btn.attr('disabled', true);

    if(page + 1 < img_comment_data.num_pages)
      next_btn.attr('disabled', false);
    else
      next_btn.attr('disabled', true);

    cur_page = page;
  }

  var clickPic = function(id) {
    document.documentElement.style.overflow='hidden';

    $('#pic').attr('data-original', img_data[id].url).lazyload({
      effect: 'fadeIn',
      error: function () {
        this.src = 'assets/error.png';
      }
    });
    show_pic.show();

    img_comment_data = null;
    $.getJSON('./assets/img_comments/' + id % 6 + '_pages.json', function(data) {
      img_comment_data = data;

      clickPage(id, 0);

      if (currentPos) {
        $('#distance').html('Distance: ' + getDistance(img_comment_data.latitude, img_comment_data.longitude) + 'km');
      } else {
        $('#distance').html('Location not avalible');
      }

      next_btn.click(function() {
        clickPage(id, cur_page + 1);
      });
      prev_btn.click(function() {
        clickPage(id, cur_page - 1);
      });
    });
  };

  var get_min_col = function (height) {
    var ret = 0;
    var curmin = height[0];
    for (var i = 1; i < height.length; i++) {
      if (height[i] < curmin) {
        curmin = height[i];
        ret = i;
      }
    }
    return ret;
  };

  var appendPic = function(append_num) {
    if (img_data === null) {  //Image data load failed
      return;
    }
    if (cur_load_num >= load_max) {
      return;
    }

    var height = [];

    for (var i = 0; i < 4; i++) {
      height[i] = $('#col' + i).height();
    }

    for (var i = 0; i < append_num; i++) {
      var min = get_min_col(height);

      var newPanel = document.createElement('li');
      newPanel.innerHTML = "<img src='assets/loading.png' data-original='" 
        + img_data[cur_pic_id].url + "'/>";
      newPanel.setAttribute('onclick', 'clickPic(' + cur_pic_id +');');
      newPanel.setAttribute('class', 'panel small-panel');

      //loop in image set
      cur_pic_id++;
      cur_pic_id %= img_data.length;

      $('#col' + min).append(newPanel);

      height[min] = $("#col" + min).height();

      cur_load_num++;

      $(newPanel.getElementsByTagName('img')).lazyload({
        effect: 'fadeIn',
        error: function () {
          this.src = 'assets/error.png';
        }
      });
    }
  };

  $(function() {
    $.getJSON('assets/img_urls.json', function(data) {
      img_data = data;
      appendPic(20);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(data) {
        currentPos = data;
      }, function(error) {
        console.log(error);
        alert("Failed to get location");
      });
    }

    $('#bg').click(clickClose);
    $('#close').click(clickClose);
    $('#pic').click(clickClose);

    $(window).scroll(function() {
      if ($(window).scrollTop() + $(window).height() * 1.3 > $(document).height()) {
        appendPic(20);
      }
    });
  });

  window.clickPic = clickPic;
})();
