'use strict';

angular.module('searaClientApp')
  .controller('NewsIndexCtrl',function( $scope, $rootScope, $timeout, $q, $location, GlobalService, GeneralConfigService, FolderService, AuthService, $interval) {

    articleCtrl.call(this, $scope, $rootScope, FolderService, AuthService, GlobalService, GeneralConfigService, $interval);

    $scope.canEdit = $rootScope.canEditNews;
    $rootScope.titleName = 'News & Updates';
    $scope.articleType = 'Article';
    $scope.articleTypeInDescription = 'article';
    $scope.showDate = true;

    var token = AuthService.authToken;
    var userId = AuthService.currentUser.user_id;
    var groupId = AuthService.currentUser.group_id;
    var apiUrl = GlobalService.apiUrl;
    var proxyRequest = GlobalService.proxyRequest;


    $scope.selectedArticleIndex = -1; //for shaking icons
    $scope.selectedArticleId = -1;
    $scope.selectedArticle = null;

    var promise;
    var randomNumber;

    var formatArticleDate = function(dateStr){
      var date = new Date(dateStr);
      var d = date.getDate();

      //leadingZeroAndOrdinalSuffix
      d = (d<10? '0':'')+d+
        (d==11? 'th' :
        d==12? 'th'  :
        d%10==1? 'st':
        d%10==2? 'nd':
        d%10==3? 'rd': 'th');
      // var monthName = ['']
      var monthName = ['January', 'February', 'March', 
      'April', 'May', 'June', 
      'July', 'August', 'September', 
      'October', 'November', 'December'];
      return d+' '+monthName[date.getMonth()]+' '+date.getFullYear();
    }

    $scope.listArticles = function(){
      if(!$rootScope.isOnline){
        if(window.useLocalFileSystem) {
          GlobalService.showSimpleDialog('No connection. Only Presentations and Favorites available.');
        }
        else {
          GlobalService.showSimpleDialog('No connection. Please try again.');
        }
        return;
      }
      GlobalService.showLoadingMask();
      proxyRequest(
        'news/?auth_token='+token,
        'GET')
      .success(function(data, status){
        $scope.articles = data.news;
        randomNumber = Math.random();
        $scope.articles.forEach(function(article){
          article.formattedPublishedDate = formatArticleDate(article.published_date);
        });
        $scope.articles.forEach(function(article){
          article.thumbnailSource = $scope.getThumbnailSource(article.asset_id);
        });

        GlobalService.hideLoadingMask();
      })
      .error(function(data, status){
        GlobalService.hideLoadingMask();
        if(status==401) return;
        GlobalService.showSimpleDialog('Cannot connect to the server');
      });
    }



    // $scope.hideImage = function(){
    //   FolderService.hideImage($scope);
    // }

    $scope.deleteArticle = function(){  
      GlobalService.showLoadingMask();
      proxyRequest(
        'news/'+$scope.selectedArticleId+'/?auth_token='+token,
        'DELETE'
      )
      .success(function(data, status){
        GlobalService.hideLoadingMask();
        if(data.errorType){
          GlobalService.showSimpleDialog('Cannot delete Article. Please try again.');
          return;
        }
        $scope.listArticles();
        $('#confirmDeleteArticleModal').modal('hide');
      })
      .error(function(){
        GlobalService.hideLoadingMask();
      });
    }


        //   //var deferred = $q.defer();
        //   //$timeout(function(){deferred.resolve();}, 1000);
        //   // deferred.promise.then(function(){
        //   $('.modal-backdrop').remove();
        //   $location.path('/articles/'+$scope.selectedArticleId+'/edit');
        //   // });

        // }

    $scope.addArticle = function(){
      if(!$scope.selectedPdf || !$scope.selectedThumbnail){
        GlobalService.showSimpleDialog('Please select files to upload');
        return;
      }
      var waitForPdfUpload = $q.defer();

      GlobalService.showLoadingMask(0, true);
      GlobalService.proxyUpload('news/?auth_token='+token,
        'POST', {
          description: $scope.newArticle.description || '',
          send_notification: $scope.sendNotification,
          REQUEST_METHOD: 'POST'
        },
        $scope.selectedPdf
      )
      .success(function(data, status){
        if(data.error_message){
          GlobalService.hideLoadingMask();
          GlobalService.showSimpleDialog(data.error_message);
          return;
        }
        waitForPdfUpload.resolve(data.article);
      })
      .error(function(){
        waitForPdfUpload.reject();
        GlobalService.hideLoadingMask();
      });

      waitForPdfUpload.promise.then(function(article){
          GlobalService.proxyUpload('news/'+article.id+'/thumbnail/?auth_token='+token,
          'POST',
          {},
          $scope.selectedThumbnail
        )
        .success(function(data, status){
          if(data.error_message){
            GlobalService.hideLoadingMask();
            GlobalService.showSimpleDialog(data.error_message);
          }
          $scope.clearFile();
          $('#addArticleModal').modal('hide');
          $scope.listArticles();
          GlobalService.hideLoadingMask();
        })
        .error(function(){
          GlobalService.hideLoadingMask();
        });
      });
    }

    $scope.editArticle = function(){
      GlobalService.showLoadingMask();
      proxyRequest(
        'news/'+$scope.selectedArticleId+'/?auth_token='+token,
        'PUT',
        $scope.selectedArticle
      )
      .success(function(data, status){
        if(data.error_message){
          GlobalService.showSimpleDialog(data.error_message);
          return;
        }
        $('#editArticleModal').modal('hide');
        $scope.listArticles();
        GlobalService.hideLoadingMask();
      })
      .error(function(){
        GlobalService.hideLoadingMask();
      });
    }
    
    $scope.reuploadArticleThumbnail = function(){
      if(!$scope.selectedThumbnail){
        GlobalService.showSimpleDialog('Please select preview image');
        return;
      }
      GlobalService.showLoadingMask(0);
      GlobalService.proxyUpload('news/'+$scope.selectedArticleId+'/thumbnail/?auth_token='+token,
          'POST',
          {},
          $scope.selectedThumbnail
        )
        .success(function(data, status){
          if(data.error_message){
            GlobalService.hideLoadingMask();
            GlobalService.showSimpleDialog(data.error_message);
            return;
          }
          $scope.clearFile();
          GlobalService.hideLoadingMask();
          $('#reuploadArticleThumbnailModal').modal('hide');
          $scope.listArticles();
        })
        .error(function(){
          GlobalService.hideLoadingMask();
        });
    }

    var titlebarRightButtons = [
      { functionToCall: "showSearchArticleDialog", args: '()', iconClass: 'search-button', text: null }
    ];
    $rootScope.setTitlebarRightButtons($scope, titlebarRightButtons);
});
  