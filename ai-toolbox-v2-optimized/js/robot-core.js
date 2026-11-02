/* robot-core v1: URDF viewer + DH-FK calculator + quantization estimator
   all local: models/meshes never leave the device */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }

  /* ===== 1. URDF viewer ===== */
  (function(){
    var uf = $('u-file'), um = $('u-mesh'), udemo = $('u-demo'),
        uload = $('u-load'), uv = $('u-view'), uj = $('u-joints'), us = $('u-st');
    if(!uv || !udemo) return;
    if(!window.THREE){ uv.textContent = 'three.js load fail'; return; }
    if(!window.URDFLoader){ uv.textContent = 'URDFLoader load fail'; return; }
    var T = window.THREE;
    var scene = new T.Scene();
    scene.background = new T.Color(0x141a24);
    var camera = new T.PerspectiveCamera(45, 4/3, 0.01, 100);
    var renderer = new T.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    uv.style.height = '420px';
    uv.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    scene.add(new T.AmbientLight(0xffffff, 0.55));
    var d1 = new T.DirectionalLight(0xffffff, 0.9); d1.position.set(3,5,4); scene.add(d1);
    var d2 = new T.DirectionalLight(0xffffff, 0.35); d2.position.set(-4,2,-3); scene.add(d2);
    var grid = new T.GridHelper(4, 20, 0x3a4a5f, 0x253140); scene.add(grid);
    var axes = new T.AxesHelper(0.5); axes.position.y = 0.001; scene.add(axes);
    var theta = 0.8, phi = 1.05, radius = 2.2, look = new T.Vector3(0, 0.4, 0);
    function cam(){
      camera.position.set(
        look.x + radius * Math.sin(phi) * Math.cos(theta),
        look.y + radius * Math.cos(phi),
        look.z + radius * Math.sin(phi) * Math.sin(theta));
      camera.lookAt(look);
    }
    var drag = false, lx = 0, ly = 0;
    renderer.domElement.addEventListener('pointerdown', function(e){
      drag = true; lx = e.clientX; ly = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener('pointermove', function(e){
      if(!drag) return;
      theta += (e.clientX - lx) * 0.008;
      phi = Math.max(0.15, Math.min(1.52, phi - (e.clientY - ly) * 0.008));
      lx = e.clientX; ly = e.clientY; cam();
    });
    renderer.domElement.addEventListener('pointerup', function(){ drag = false; });
    renderer.domElement.addEventListener('wheel', function(e){
      e.preventDefault();
      radius = Math.max(0.3, Math.min(15, radius * (e.deltaY > 0 ? 1.12 : 0.89)));
      cam();
    }, {passive: false});
    function fit(){
      var w = uv.clientWidth || 600, h = uv.clientHeight || 420;
      renderer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', fit);
    var holder = null, urdf = null, meshMap = {};
    function takeMeshes(fl){
      meshMap = {};
      for(var i = 0; i < fl.length; i++) meshMap[fl[i].name] = URL.createObjectURL(fl[i]);
    }
    var loader = new window.URDFLoader();
    loader.manager.setURLModifier(function(url){
      var base = String(url).split('/').pop();
      if(meshMap[base]) return meshMap[base];
      return url;
    });
    function dropOld(){ if(holder){ scene.remove(holder); holder = null; urdf = null; } }
    function sliders(){
      uj.innerHTML = '';
      if(!urdf) return;
      Object.keys(urdf.joints).forEach(function(nm){
        var j = urdf.joints[nm];
        var jt = j.jointType || j.type;
        if(!j || jt === 'fixed') return;
        var lo, hi, mul;
        if(jt === 'continuous'){ lo = -Math.PI; hi = Math.PI; mul = Math.PI/180; }
        else if(jt === 'prismatic'){
          lo = (j.limit && isFinite(j.limit.lower)) ? j.limit.lower : 0;
          hi = (j.limit && isFinite(j.limit.upper)) ? j.limit.upper : 0.2;
          mul = 1;
        } else {
          lo = (j.limit && isFinite(j.limit.lower)) ? j.limit.lower : -Math.PI;
          hi = (j.limit && isFinite(j.limit.upper)) ? j.limit.upper : Math.PI;
          mul = Math.PI/180;
        }
        var row = document.createElement('div');
        row.style.margin = '4px 0';
        var lb = document.createElement('label');
        lb.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;color:#9fb0c3';
        lb.textContent = nm + ' \u00b7 ' + jt;
        var val = document.createElement('span');
        var rng = document.createElement('input');
        rng.type = 'range';
        rng.style.width = '100%';
        var stp = (hi - lo) / mul / 200;
        if(!(stp > 0)) stp = 0.01;
        rng.min = String(lo / mul); rng.max = String(hi / mul); rng.step = String(stp);
        var cur = isFinite(j.angle) ? j.angle : 0;
        if(cur < lo) cur = lo; if(cur > hi) cur = hi;
        rng.value = String(cur / mul);
        function apply(){
          urdf.setJointValue(nm, parseFloat(rng.value) * mul);
          val.textContent = Number(rng.value).toFixed(1);
        }
        rng.addEventListener('input', apply);
        apply();
        lb.appendChild(val);
        row.appendChild(lb); row.appendChild(rng);
        uj.appendChild(row);
      });
    }
    function mount(txt, tag){
      dropOld();
      try{ urdf = loader.parse(txt); }
      catch(err){ us.textContent = 'URDF parse fail: ' + (err && err.message || err); return; }
      holder = new T.Group();
      holder.add(urdf);
      holder.rotation.x = -Math.PI / 2;
      scene.add(holder);
      var box = new T.Box3().setFromObject(holder);
      var size = box.getSize(new T.Vector3());
      var ctr = box.getCenter(new T.Vector3());
      if(isFinite(size.x) && size.x > 0){
        look.copy(ctr);
        radius = Math.max(size.x, size.y, size.z) * 1.5 + 0.3;
      }
      cam(); sliders(); fit();
      var jc = Object.keys(urdf.joints).filter(function(k){
        var t = urdf.joints[k];
        return t && (t.jointType || t.type) !== 'fixed';
      }).length;
      us.textContent = tag + ' rendered, movable joints: ' + jc + ' (drag to orbit, wheel to zoom)';
    }
    var DEMO = [
      '<?xml version="1.0"?>',
      '<robot name="nova_arm">',
      '  <link name="base">',
      '    <visual><origin xyz="0 0 0.05"/><geometry><cylinder radius="0.12" length="0.1"/></geometry><material name="gray"><color rgba="0.45 0.5 0.58 1"/></material></visual>',
      '  </link>',
      '  <joint name="j1" type="revolute">',
      '    <parent link="base"/><child link="l1"/>',
      '    <origin xyz="0 0 0.1"/><axis xyz="0 0 1"/>',
      '    <limit lower="-3.14" upper="3.14" effort="10" velocity="1"/>',
      '  </joint>',
      '  <link name="l1">',
      '    <visual><origin xyz="0 0 0.15"/><geometry><box size="0.08 0.08 0.3"/></geometry><material name="teal"><color rgba="0.27 0.88 0.78 1"/></material></visual>',
      '  </link>',
      '  <joint name="j2" type="revolute">',
      '    <parent link="l1"/><child link="l2"/>',
      '    <origin xyz="0 0 0.3"/><axis xyz="0 1 0"/>',
      '    <limit lower="-1.57" upper="1.57" effort="10" velocity="1"/>',
      '  </joint>',
      '  <link name="l2">',
      '    <visual><origin xyz="0 0 0.14"/><geometry><box size="0.06 0.06 0.28"/></geometry><material name="blue"><color rgba="0.36 0.54 0.98 1"/></material></visual>',
      '  </link>',
      '  <joint name="j3" type="revolute">',
      '    <parent link="l2"/><child link="tool"/>',
      '    <origin xyz="0 0 0.28"/><axis xyz="0 1 0"/>',
      '    <limit lower="-1.57" upper="1.57" effort="10" velocity="1"/>',
      '  </joint>',
      '  <link name="tool">',
      '    <visual><origin xyz="0 0 0.06"/><geometry><sphere radius="0.05"/></geometry><material name="tip"><color rgba="0.98 0.62 0.26 1"/></material></visual>',
      '  </link>',
      '</robot>'
    ].join('\n');
    udemo.addEventListener('click', function(){ mount(DEMO, 'demo arm'); });
    uload.addEventListener('click', function(){
      var f = uf.files && uf.files[0];
      if(!f){ us.textContent = 'select a URDF file first, or click demo arm'; return; }
      var r = new FileReader();
      r.onload = function(){ mount(String(r.result), f.name); };
      r.onerror = function(){ us.textContent = 'read fail'; };
      r.readAsText(f);
    });
    um.addEventListener('change', function(){
      if(um.files && um.files.length){
        takeMeshes(um.files);
        us.textContent = 'meshes registered: ' + um.files.length + ' (matched by filename, .stl only in v1)';
      }
    });
    cam(); fit();
    (function loop(){ requestAnimationFrame(loop); renderer.render(scene, camera); })();
  })();

  /* ===== 2. FK forward kinematics (standard DH) ===== */
  (function(){
    var rows = $('fk-rows'), go = $('fk-go'), out = $('fk-out');
    if(!rows || !go) return;
    var defs = [[0,0,0,0.10],[0,90,0.20,0],[0,0,0.25,0],[0,0,0.10,0]];
    var cells = [];
    var tbl = document.createElement('table');
    tbl.style.cssText = 'border-collapse:collapse;margin:8px 0';
    var hr = document.createElement('tr');
    ['J','theta(deg)','alpha(deg)','a(m)','d(m)'].forEach(function(t){
      var th = document.createElement('th');
      th.textContent = t;
      th.style.cssText = 'font-size:12px;padding:4px 8px;text-align:left;color:#9fb0c3';
      hr.appendChild(th);
    });
    tbl.appendChild(hr);
    defs.forEach(function(def, ri){
      var tr = document.createElement('tr');
      var lab = document.createElement('td');
      lab.textContent = 'J' + (ri + 1);
      lab.style.cssText = 'font-size:12px;padding:2px 8px;color:#9fb0c3';
      tr.appendChild(lab);
      var rowCells = [];
      def.forEach(function(v){
        var td = document.createElement('td');
        var inp = document.createElement('input');
        inp.type = 'number'; inp.step = '0.01'; inp.value = String(v);
        inp.style.cssText = 'width:60px;padding:4px 6px';
        td.appendChild(inp); tr.appendChild(td);
        rowCells.push(inp);
      });
      tbl.appendChild(tr); cells.push(rowCells);
    });
    var wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    wrap.appendChild(tbl);
    rows.appendChild(wrap);
    go.addEventListener('click', function(){
      function mul4(A, B){
        var O = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        for(var i = 0; i < 4; i++)
          for(var k = 0; k < 4; k++)
            for(var j = 0; j < 4; j++)
              O[i][j] += A[i][k] * B[k][j];
        return O;
      }
      function dhT(th, al, a, d){
        var ct = Math.cos(th), st = Math.sin(th),
            ca = Math.cos(al), sa = Math.sin(al);
        return [[ct, -st*ca, st*sa, a*ct],
                [st, ct*ca, -ct*sa, a*st],
                [0, sa, ca, d],
                [0, 0, 0, 1]];
      }
      var T0 = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], lines = [];
      for(var r = 0; r < 4; r++){
        var th = (parseFloat(cells[r][0].value) || 0) * Math.PI / 180;
        var al = (parseFloat(cells[r][1].value) || 0) * Math.PI / 180;
        var a = parseFloat(cells[r][2].value) || 0;
        var d = parseFloat(cells[r][3].value) || 0;
        T0 = mul4(T0, dhT(th, al, a, d));
        lines.push('T1->J' + (r + 1) + ' =');
        for(var i = 0; i < 4; i++)
          lines.push('  [' + T0[i].map(function(v){ return v.toFixed(3); }).join(', ') + ']');
      }
      lines.push('end pos  x=' + T0[0][3].toFixed(4) + '  y=' + T0[1][3].toFixed(4) + '  z=' + T0[2][3].toFixed(4) + '  (m)');
      out.textContent = lines.join('\n');
    });
  })();

  /* ===== 3. quantization VRAM estimator (honest AI-compiler slice) ===== */
  (function(){
    var qb = $('q-b'), qoh = $('q-oh'), qgo = $('q-go'), qout = $('q-out');
    if(!qb || !qgo) return;
    qgo.addEventListener('click', function(){
      var b = parseFloat(qb.value) || 0;
      var oh = parseFloat(qoh.value) || 1.2;
      if(b <= 0){ qout.textContent = 'params (B) required, e.g. 7 = 7B'; return; }
      var bytes = {FP32: 4, FP16: 2, INT8: 1, INT4: 0.5};
      var chips = [['Orin Nano 8G', 8], ['Orin NX 16G', 16], ['AGX Orin 64G', 64], ['Thor 128G', 128]];
      var lines = ['params ' + b + 'B x overhead ' + oh + ' (weights only; KV/activations not included)', ''];
      Object.keys(bytes).forEach(function(k){
        var gb = b * bytes[k] * oh;
        var marks = chips.map(function(c){
          return c[0] + (gb <= c[1] ? ' \u2713' : ' \u2717');
        }).join('   ');
        lines.push(k + '  ' + gb.toFixed(1) + ' GB    ' + marks);
      });
      lines.push('');
      lines.push('ref: 7B INT4 fits Orin Nano; VLA pipeline includes vision and action heads,');
      lines.push('convert per model card. Weights only - no compression-rate hype.');
      qout.textContent = lines.join('\n');
    });
  })();
})();
