/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

Zone.__load_patch('node_async_check', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  try {
    require('async_hooks');
    (process as any)._rawDebug('load async_hooks');
    // nodejs 8.x with async_hooks support.
    // disable original Zone patch
    global['__Zone_disable_ZoneAwarePromise'] = true;
    global['__Zone_disable_node_timers'] = true;
    global['__Zone_disable_nextTick'] = true;
    global['__Zone_disable_handleUnhandledPromiseRejection'] = true;
    global['__Zone_disable_crypto'] = true;
    global['__Zone_disable_fs'] = true;
  } catch (err) {
    global['__Zone_disable_node_async_hooks'] = true;
  }
});