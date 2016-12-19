/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ifEnvSupports} from '../test-util';

const setPrototypeOf = (Object as any).setPrototypeOf || function(obj, proto) {
  obj.__proto__ = proto;
  return obj;
}

function mediaQueriesSupported() {
  console.log('check supported');
  console.log('window.matchMedia', window.matchMedia);
  console.log('window.msMatchMedia', (<any>window).msMatchMedia);
  return (typeof window.matchMedia != 'undefined' || typeof (<any>window).msMatchMedia != 'undefined');
}
(<any>mediaQueriesSupported).message = 'MatchMedia';

/*
 * To test MatchMedia Media Queries we need to resize the browser window.
 * However according to the browser rules you cannot change the size of the current window.
 * The next best thing is to create a new window with window.open and then change its
 * size using window.resizeTo.
 *
 * Unfortunately opening and closing browser windows significantly
 * increases the overall test time.
 */

describe('MatchMedia', ifEnvSupports(mediaQueriesSupported, function() {

  let newWindow: Window;
  let testZone: Zone;
  let mql: MediaQueryList;

  beforeEach(function() {
    testZone = Zone.current.fork({name: 'matchMediaTest'});
    newWindow = window.open("","", "width=100, height=100");
    console.log('open new window');
    mql = newWindow.matchMedia("(min-width: 500px)");
    // we set prototype here because the new created window is not
    // patched by zone, and since Firefox 7, we can't resize a window
    // or tab that wasn't created by window.open()
    setPrototypeOf(mql, MediaQueryList.prototype);
  });

  afterEach(function() {
    newWindow.close();
  });

  it('should be in the correct zone', function(done) {
    testZone.run(function() {
      mql.addListener(function() {
        expect(Zone.current).toBe(testZone);
        done();
      });

      newWindow.resizeTo(600, 250);
    });
  });

  it('should allow adding of a callback', function(done) {
    let log = '';
    mql.addListener(function() {
      log = 'changed';
    });

    newWindow.resizeTo(600, 250);

    //allow some time for the browser to react to window size change
    setTimeout(function() {
      expect(log).toEqual('changed');
      done();
    }, 200);
  });

  it('should allow adding of multiple callbacks', function(done){
    let log = '';
    mql.addListener(function() {
      log = 'changed';
    });

    mql.addListener(function() {
      log += ';secondchange';
    });

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('changed;secondchange');
      done();
    }, 200);
  });

  it('should allow removal of a callback', function(done){
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    let callback2 = function() {
      log += 'callback2';
    }

    mql.addListener(callback1);
    mql.addListener(callback2);
    mql.removeListener(callback1);

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('callback2');
      done();
    }, 200);
  });

  it('should allow removal of multiple callbacks', function(done){
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    let callback2 = function() {
      log += 'callback2';
    }

    mql.addListener(callback1);
    mql.addListener(callback2);
    mql.removeListener(callback1);
    mql.removeListener(callback2);

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('');
      done();
    }, 200);
  });

  it('should not crash when trying to remove a non registered callback', function(done) {
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    mql.addListener(callback1);

    mql.removeListener(function() {});

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('callback1');
      done();
    }, 200);
  });
}));