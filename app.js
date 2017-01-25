angular.module('app', ['ngCookies', 'ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
        var resolve = {
            authorize: ['$q', '$cookies', function($q, $cookies) {
                return $cookies.get('sid') ? $q.resolve([]) : $q.reject([])
            }]
        };
        $routeProvider
            .when('/', {
                controller:'Public as public',
                templateUrl:'public.html'
            })
            .when('/sites', {
                controller:'SitesList as sites',
                templateUrl:'sites.html',
                resolve: angular.extend({
                    sites: ['$q', 'SiteService', function($q, SiteService) {
                        return SiteService.retrieve()
                    }]
                }, resolve)
            })
            .when('/site/:siteId', {
                controller:'Site as site',
                templateUrl:'site.html',
                resolve: angular.extend({
                    site: ['$route', '$q', 'SiteService', function($route, $q, SiteService) {
                        return SiteService.byId($route.current.params.siteId)
                    }]
                }, resolve)
            })
            .when('/device/:deviceId', {
                controller:'Device as device',
                templateUrl:'device.html',
                resolve: angular.extend({
                    device: ['$route', '$q', 'SiteService', function($route, $q, SiteService) {
                        return SiteService.device($route.current.params.deviceId)
                    }]
                }, resolve)
            })
            .otherwise({
                redirectTo:'/'
            });
    }])
    .constant('ApiUrl', '//dev-api.avhs.axis.com/')
    .service('Auth', ['$http', '$cookies', 'ApiUrl', function($http, $cookies, ApiUrl) {
        return function(user, password) {
            return $http.post(ApiUrl + 'user.php',{
                a: "login",
                u: user,
                p: password
            },{
                'Content-Type': 'application/json'
            }).then(function(response) {
                $cookies.put('sid', response.data.session.id)
            }, function() {
                $cookies.remove('sid')
            });
        }
    }])
    .service('SiteService', ['$q', '$http', '$cookies', 'ApiUrl', function($q, $http, $cookies, ApiUrl) {
        return {
            retrieve: function() {
                var d = $q.defer();
                $http.get(ApiUrl + 'site.php?api=JSON&a=retrieve&sid=' + $cookies.get('sid'))
                    .then(function(response) {
                        d.resolve(response.data.sites)
                    }, d.reject);
                return d.promise;
            },
            byId: function(siteId) {
                var d = $q.defer();
                $http.get(ApiUrl + 'site.php?api=JSON&a=retrieve&siteid=' + siteId + '&sid=' + $cookies.get('sid'))
                    .then(function(response) {
                        d.resolve(response.data.sites[siteId])
                    }, d.reject);
                return d.promise;
            },
            device: function(deviceId) {
                var d = $q.defer();
                $http.get(ApiUrl + 'device.php?api=JSON&a=retrieve&deviceid[]=' + deviceId + '&sid=' + $cookies.get('sid'))
                    .then(function(response) {
                        d.resolve(response.data.devices[deviceId])
                    }, d.reject);
                return d.promise;
            }
        }
    }])
    .controller('Public', ['$location', 'Auth', function($location, Auth) {
        var that = this;
        this.onsubmit = function() {
            Auth(this.username, this.password).then(function() {
                $location.url('/sites')
            },function() {
                that.error = true
            })
        }
    }])
    .controller('SitesList', ['sites', function(sites) {
        this.model = sites;
    }])
    .controller('Site', ['site', function(site) {
        this.model = site;
    }])
    .controller('Device', ['device', function(device) {
        this.model = device;
    }]);
