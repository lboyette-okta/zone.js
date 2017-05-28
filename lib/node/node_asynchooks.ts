/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * patch nodejs async operations (timer, promise, net...) with
 * nodejs async_hooks
 */
Zone.__load_patch('node_async_hooks', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  let async_hooks;
  const BEFORE_RUN_TASK_STATUS = 'BEFORE_RUN_TASK_STATUS';

  async_hooks = require('async_hooks');

  const idTaskMap: {[key: number]: Task} = (Zone as any)[Zone.__symbol__('nodeTasks')] = {};

  const noop = function() {};

  function init(id: number, provider: string, parentId: number, parentHandle: any) {
    // @JiaLiPassion, check which tasks are microTask or macroTask
    //(process as any)._rawDebug('init hook', id , provider);
    if (provider === 'TIMERWRAP') {
      return;
    }
    // create microTask if 'PROMISE'
    if (provider === 'PROMISE') {
      const task = idTaskMap[id] = Zone.current.scheduleMicroTask(provider, noop, null, noop);
      //(process as any)._rawDebug('after init', id, 'status', task.state);
      return;
    }
    // create macroTask in other cases
    if (provider === 'Timeout' || provider === 'Immediate' || provider === 'FSREQWRAP') {
      idTaskMap[id] = Zone.current.scheduleMacroTask(provider, noop, null, noop, noop);
    }
  }

  function before(id: number) {
    //(process as any)._rawDebug('before hook', id);
    // call Zone.beforeRunTask 
    const task: Task = idTaskMap[id];
    if (!task) {
      return;
    }
    (task as any)[Zone.__symbol__(BEFORE_RUN_TASK_STATUS)] = api.beforeRunTask(task.zone, task);
  }

  function after(id: number) {
    //(process as any)._rawDebug('after hook', id);
    const task: Task = idTaskMap[id];
    if (!task) {
      return;
    }
    const beforeRunTask: BeforeRunTaskStatus = (task as any)[Zone.__symbol__(BEFORE_RUN_TASK_STATUS)]; 
    if (beforeRunTask) {
      return;
    }
    (task as any)[Zone.__symbol__(BEFORE_RUN_TASK_STATUS)] = null;
    api.afterRunTask(task.zone, beforeRunTask, task);
  }

  function destroy(id: number) {
    // try to cancel the task if is not canceled
    const task: Task = idTaskMap[id];
    if (task && task.state === 'scheduled') {
      task.zone.cancelTask(task);
    }
    idTaskMap[id] = null;
  }

  process.on('uncaughtException', (err: any) => {
    const task = Zone.currentTask; 
    if (task) {
      const beforeRunTask: BeforeRunTaskStatus = (task as any)[Zone.__symbol__(BEFORE_RUN_TASK_STATUS)]; 
      if (beforeRunTask) {
        if ((task.zone as any)._zoneDelegate.handleError(Zone.current, err)) {
          throw err;
        }
      }
    }
  });

  global[Zone.__symbol__('setTimeout')] = global.setTimeout;
  global[Zone.__symbol__('setInterval')] = global.setInterval;
  global[Zone.__symbol__('setImmediate')] = global.setImmediate;

  async_hooks.createHook({ init, before, after, destroy }).enable();
});