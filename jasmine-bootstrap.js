/*
 Copyright (c) 2014 Mohammad Milad Naseri (m.m.naseri@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 Disclaimer: I did not write Jasmine. I just enjoy using it, and found
 the default HTML reporter a little too much like a desert for my tastes.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

(function () {

    jasmineRequire.html = function (jasmine) {
        jasmine.QueryString = ReportHelper.QueryString;
        jasmine.HtmlSpecFilter = ReportHelper.HtmlSpecFilter;
        jasmine.HtmlReporter = HtmlReporter;
        jasmine.menu = ReportHelper.menu;
    };

    var ReportHelper = {
        QueryString: function (options) {
            var parameters = {
                map: {},
                init: function () {
                    var queryString = options.getWindowLocation().search.length > 1 ? options.getWindowLocation().search.substring(1) : "";
                    $(queryString.split("&")).each(function () {
                        var key = this.split("=")[0];
                        parameters.map[key] = decodeURIComponent(this.split("=")[1]);
                        if (parameters.map[key] === "true") {
                            parameters.map[key] = true;
                        } else if (parameters.map[key] === "false") {
                            parameters.map[key] = false;
                        }
                    });
                    return parameters;
                },
                and: {
                    put: function (key, value) {
                        parameters.map[key] = value;
                        return parameters;
                    },
                    get: function (key) {
                        return typeof parameters.map[key] != "undefined" ? parameters.map[key] : null
                    },
                    populate: function () {
                        options.getWindowLocation().search = parameters.toString();
                    }
                },
                toString: function () {
                    var values = [];
                    $.each(parameters.map, function (key, value) {
                        if (!key) {
                            return;
                        }
                        values.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                    });
                    return "?" + values.join("&");
                }
            };
            this.setParam = function (key, value) {
                parameters.init().and.put(key, value).and.populate();
            };
            this.getParam = function (key) {
                return parameters.init().and.get(key);
            };
        },
        HtmlSpecFilter: function (options) {
            var filterString = options && options.filterString() && options.filterString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            var filterPattern = new RegExp(filterString);
            this.matches = function (specName) {
                return !filterString || filterPattern.test(specName);
            };
        },
        ReportNode: function (descriptor, type) {
            var children = [];
            this.parent = null;
            this.classNames = {};
            this.add = function (node) {
                children.push(node);
                node.parent = this;
                return node;
            };
            this.propagateStatus = function (status) {
                this.classNames[status] = true;
                if (this.parent) {
                    this.parent.propagateStatus(status);
                }
            };
            this.getClassName = function () {
                var result = [];
                $.each(this.classNames, function (className) {
                    result.push(className);
                });
                return result.join(" ");
            };
            this.render = function () {
                var sanitize = function (string) {
                    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                };
                var sanitizeHtml = function (string) {
                    return sanitize(string).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\.\.\./g, "&hellip;");
                };
                var element, target;
                if (type == "root") {
                    element = $("<div class='container-fluid'><div class='report'><div class='row'><h1 class='page-header'>Test Execution Report<small class='pull-right'></small></h1></div></div></div><div class='navigation'><ul class='nav nav-pills nav-stacked'>" +
                        "<li class='running' title='Active tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-check'></span> <em>Active tests</em><span class='badge pull-right'>" + (testCollection.count.total - testCollection.count.disabled) + "</span></a></li>" +
                        "<li class='not-running' title='Disabled tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-unchecked'></span> <em>Disabled tests</em><span class='badge pull-right'>" + testCollection.count.disabled + "</span></a></li>" +
                        "<li class='all' title='All tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-list'></span> <em>All tests</em><span class='badge pull-right'>" + testCollection.count.total + "</span></a></li>" +
                        "<li class='failed" + (testCollection.count.failed ? " nonempty" : "") + "' title='Failed tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-exclamation-sign'></span> <em>Failed tests</em><span class='badge pull-right'>" + testCollection.count.failed + "</span></a></li>" +
                        "<li class='pending" + (testCollection.count.pending ? " nonempty" : "") + "' title='Pending tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-time'></span> <em>Pending tests</em><span class='badge pull-right'>" + testCollection.count.pending + "</span></a></li>" +
                        "<li class='successful' title='Passed tests'><a href='javascript:void(0);' onclick='jasmine.menu(this);'><span class='glyphicon glyphicon-ok'></span> <em>Passed tests</em><span class='badge pull-right'>" + testCollection.count.succeeded + "</span></a></li>" +
                        "</ul><div class='container' title='Catch exceptions'><label class='checkbox-inline'><input type='checkbox' class='exceptions-check'><span class='glyphicon glyphicon-screenshot'></span><em>Raise exceptions</em></label></div>" +
                        "<div class='container' title='Show a minimal interface'><label class='checkbox-inline'><input type='checkbox' class='minimal-check'><span class='glyphicon glyphicon-eye-open'></span><em>Minimal interface</em></label></div>" +
                        "<div class='container' title='Expand the navigation bar'><a href='javascript:void(0);' class='expander'><span class='whileExpanded'><span class='glyphicon glyphicon-chevron-left'></span> Collapse</span><span class='whileCollapsed'><span class='glyphicon glyphicon-chevron-right'></span></span></a></div>");
                    target = element.find(".report");
                    var raiseExceptionsCheckbox = element.find("input.exceptions-check");
                    raiseExceptionsCheckbox.click(function () {
                        if ($.isFunction(jasmine.onRaiseExceptionsClick)) {
                            jasmine.onRaiseExceptionsClick.apply(this, arguments);
                        }
                        queryString.setParam("catch", this.checked);
                    });
                    if (queryString.getParam("catch") === true) {
                        raiseExceptionsCheckbox.attr('checked', 'checked');
                    }
                    var minimalInterface = element.find("input.minimal-check");
                    minimalInterface.click(function () {
                        queryString.setParam('minimal', this.checked);
                    });
                    if (queryString.getParam("minimal") === true) {
                        minimalInterface.attr('checked', 'checked');
                        if (testCollection.count.failed) {
                            $(".navigation").addClass("dim");
                            $(".report").addClass("dim");
                        }
                    }
                    var expander = element.find("a.expander");
                    expander.click(function () {
                        $(".navigation").toggleClass("collapsed");
                        target.toggleClass("collapsed");
                    });
                    element.find("li").add(element.find(".container")).tooltip({
                        container: element,
                        placement: "right"
                    });
                } else if (type == "suite") {
                    element = $("<div class='test-suite " + this.getClassName() + "' id='" + descriptor.id + "'><h4 class='suite-title'><em><span></span></em><a href=\"?spec=" + encodeURIComponent(descriptor.fullName) + (queryString.getParam("minimal") ? "&amp;minimal=" + queryString.getParam("minimal") : "") + "\">" + sanitizeHtml(descriptor.description) + " &hellip;</a></h4><div class='suite-body'></div></div>");
                    target = element.find(".suite-body");
                    $(element).find("em").click(function () {
                        $(this).parent().parent().toggleClass('collapsed');
                    });
                } else if (type == "spec") {
                    target = element = $("<div class='test-specification " + this.getClassName() + "' id='" + descriptor.id + "'><span class='icon'></span><a href=\"?spec=" + encodeURIComponent(descriptor.fullName) + (queryString.getParam("minimal") ? "&amp;minimal=" + queryString.getParam("minimal") : "") + "\">&hellip; " + sanitizeHtml(descriptor.description) + "</a></div>");
                } else {
                    return $("<div class='alert alert-danger'>We don't quite know how to render a result node of type <strong>" + type + "</strong></div>");
                }
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    target.append(child.render());
                }
                if (type == "root") {
                    if (queryString.getParam("spec")) {
                        target.find(".test-suite").first().before("<div class='run-all'><a class='btn btn-primary' href='?" + (queryString.getParam("minimal") ? "&amp;minimal=" + queryString.getParam("minimal") : "") + "'>Run all tests</a></div>");
                    }
                    if (testCollection.count.failed > 0) {
                        target.find(".test-suite").first().before("<div class='alert alert-danger'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button><p><strong><span class='glyphicon glyphicon-eye-open'></span> Attention</strong> There have been <a href='javascript:jasmine.menu(\"failed\");' class='alert-link'>" + testCollection.count.failed + " test failures.</a></p></div>");
                    }
                    if (testCollection.count.failed == 0 && testCollection.count.disabled == 0) {
                        target.find(".test-suite").first().before("<div class='alert alert-success'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button><p><strong><span class='glyphicon glyphicon-ok'></span> Great!</strong> <a href='javascript:jasmine.menu(\"successful\");' class='alert-link'>All scheduled tests </a> have passed without any problems.</p></div>");
                    }
                    if (testCollection.count.pending > 0) {
                        target.find(".test-suite").first().before("<div class='alert alert-warning'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button><p><strong><span class='glyphicon glyphicon-time'></span> Look Out</strong> <a href='javascript:jasmine.menu(\"pending\");' class='alert-link'>There are specifications</a> that have been defined but are in pending status.</p></div>");
                    }
                    target.find("h1.page-header small").html("Jasmine " + jasmine.version);
                    target.find(".test-suite").each(function () {
                        var $this = $(this);
                        var failed = $this.find(".test-specification.failed").length;
                        var pending = $this.find(".test-specification.pending").length;
                        var disabled = $this.find(".test-specification.disabled").length;
                        var suiteTitle = $this.find(".suite-title").first();
                        var total = $this.find(".test-specification").length;
                        suiteTitle.append("<span class='status-report pull-right label label-info'>" + total + "</span>").find('.label-info').tooltip({
                            title: "Total number of specifications in this suite: " + total,
                            container: "body"
                        });
                        if (failed) {
                            suiteTitle.append("<span class='status-report pull-right label label-danger'>" + failed + "</span>").find('.label-danger').tooltip({
                                title: "Failed specifications in this suite: " + failed,
                                container: "body"
                            });
                        }
                        if (pending) {
                            suiteTitle.append("<span class='status-report pull-right label label-warning'>" + pending + "</span>").find(".label-warning").tooltip({
                                title: "There are " + pending + " specifications pending implementation",
                                container: "body"
                            });
                        }
                        if (disabled) {
                            suiteTitle.append("<span class='status-report pull-right label label-default'>" + disabled + "</span>").find('.label-default').tooltip({
                                title: "There are " + disabled + " specifications that are currently disabled in this suite",
                                container: "body"
                            });
                        }
                        if (failed + pending + disabled == 0) {
                            suiteTitle.append("<span class='status-report pull-right label label-success'>OK</span>").find(".label-success").tooltip({
                                title: "All tests in this suite have passed successfully",
                                container: "body"
                            });
                        }
                    });
                    element.find("data-popover").popover();
                } else if (type == "spec" && descriptor.status == "failed") {
                    element.append("<div class='expectations'></div>");
                    var expectations = element.find(".expectations");
                    $(descriptor.failedExpectations).each(function () {
                        expectations.append("<div><span></span>" + sanitize(this.message) + "</div>");
                    });
                }
                if (type == "spec") {
                    element.find(".icon").tooltip({
                        title: sanitize(descriptor.fullName),
                        placement: "auto left",
                        html: true,
                        animation: false
                    });
                }
                return element;
            };
        },
        menu: function (target) {
            if (typeof target == 'string') {
                target = $(".navigation li." + target + " a").get(0);
            }
            var parent = target && $(target).get(0).parentNode;
            $(".report .test-suite").addClass("hidden");
            $(".report .test-specification").addClass("hidden");
            if (!target || target == 'running' || $(parent).hasClass('running')) {
                $(".report .test-suite.passed").removeClass('hidden');
                $(".report .test-suite.failed").removeClass('hidden');
                $(".report .test-suite.pending").removeClass('hidden');
                $(".report .test-suite:not(.hidden) .test-specification:not(.disabled)").removeClass('hidden');
            } else if (target == 'not-running' || $(parent).hasClass('not-running')) {
                $(".report .test-suite.disabled").removeClass("hidden");
                $(".report .test-specification.disabled").removeClass("hidden");
            } else if (target == 'all' || $(parent).hasClass('all')) {
                $(".report .hidden").removeClass("hidden");
            } else if (target == 'failed' || $(parent).hasClass('failed')) {
                $(".report .test-suite.failed").removeClass("hidden");
                $(".report .test-specification.failed").removeClass("hidden");
            } else if (target == 'pending' || $(parent).hasClass('pending')) {
                $(".report .test-suite.pending").removeClass("hidden");
                $(".report .test-specification.pending").removeClass("hidden");
            } else if (target == 'successful' || $(parent).hasClass('successful')) {
                $(".report .test-suite.passed").removeClass("hidden");
                $(".report .test-specification.passed").removeClass("hidden");
            }
            if (target) {
                var node = $(target).get(0);
                while (node && node.nodeName.toLowerCase() != "ul") {
                    node = node.parentNode;
                }
                if (node) {
                    $(node).find("li").removeClass("active");
                    $(parent).addClass("active");
                }
            }
        }
    };

    ReportHelper.ReportNode.startSuite = function (suite) {
        current = current.add(new ReportHelper.ReportNode(suite, "suite"));
    };
    ReportHelper.ReportNode.endSuite = function (suite) {
        current = current.parent;
    };
    ReportHelper.ReportNode.startSpec = function (spec) {
        testCollection.specs[spec.id] = spec;
    };
    ReportHelper.ReportNode.endSpec = function (spec) {
        if (spec.status == 'disabled') {
            testCollection.count.disabled++;
        } else if (spec.status == 'passed') {
            testCollection.count.succeeded++;
        } else if (spec.status == 'pending') {
            testCollection.count.pending++;
        } else if (spec.status == 'failed') {
            testCollection.count.failed++;
        }
        current.add(new ReportHelper.ReportNode(spec, "spec")).propagateStatus(spec.status);
    };

    var testCollection = {
        count: {
            total: 0,
            succeeded: 0,
            failed: 0,
            pending: 0,
            disabled: 0
        },
        specs: [],
        suites: new ReportHelper.ReportNode({}, "root")
    };

    var current = testCollection.suites;

    var queryString = new ReportHelper.QueryString({
        getWindowLocation: function () {
            return window.location;
        }
    });

    var HtmlReporter = function (options) {
        this.initialize = function () {
        };
        this.jasmineStarted = function (options) {
            if (queryString.getParam("catch") === null) {
                queryString.setParam("catch", "true");
                return;
            }
            testCollection.count.total = options.totalSpecsDefined;
        };
        this.jasmineDone = function () {
            $(options.getContainer()).append(testCollection.suites.render());
            ReportHelper.menu(null);
            if (queryString.getParam("minimal")) {
                $(".navigation .expander").click();
                $(".report .alert").hide();
                if (testCollection.count.failed) {
                    $(".navigation").addClass("dim");
                    $(".report").addClass("dim");
                    ReportHelper.menu("failed");
                } else if (testCollection.count.pending) {
                    $(".navigation").addClass("dim dim-secondary");
                    $(".report").addClass("dim dim-secondary");
                    ReportHelper.menu("pending");
                } else {
                    ReportHelper.menu("running");
                }
            }
        };
        this.suiteStarted = function (suite) {
            ReportHelper.ReportNode.startSuite(suite);
        };
        this.suiteDone = function (suite) {
            ReportHelper.ReportNode.endSuite(suite);
        };
        this.specStarted = function (spec) {
            ReportHelper.ReportNode.startSpec(spec);
        };
        this.specDone = function (spec) {
            ReportHelper.ReportNode.endSpec(spec);
        };
    };

})();
