'use strict';
// ============================================================
// SMART ERGONOMIC SETUP CALCULATOR (ErgoCalc)
// ============================================================
function cmToFtIn(cm){
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${ft}' ${inches}"`;
}

function updateErgoCalc(){
    const H = S.ergoHeight; // in cm
    const unit = S.ergoUnit; // 'cm' or 'in'
    const setup = S.ergoSetup;

    // OSHA & ISO 9241-5 Ergonomic Formula Calculations
    const chairCm = H * 0.255;
    const deskCm  = H * 0.415;
    const eyeCm   = H * 0.690;
    const distCm  = H * 0.380;

    // Format output strings
    const fmt = (valCm) => {
        if(unit === 'cm'){
            return `${valCm.toFixed(1)} cm`;
        } else {
            const inches = (valCm / 2.54).toFixed(1);
            return `${inches}"`;
        }
    };

    // Update Result Cards
    if($('resChairHeight')) $('resChairHeight').textContent = fmt(chairCm);
    if($('resDeskHeight'))  $('resDeskHeight').textContent  = fmt(deskCm);
    if($('resEyeLevel'))    $('resEyeLevel').textContent    = fmt(eyeCm);
    if($('resScreenDist'))  $('resScreenDist').textContent  = fmt(distCm);

    // Height display
    if($('ergoHeightDisplay')) $('ergoHeightDisplay').textContent = H;
    if($('ergoHeightUnitLabel')) $('ergoHeightUnitLabel').textContent = 'cm';
    if($('ergoHeightAltLabel')) $('ergoHeightAltLabel').textContent = `(${cmToFtIn(H)})`;

    // Dynamic Blueprint SVG Adjustments
    // Base reference: Ground floor y = 300
    const chairY = 300 - (chairCm * 2.1);
    const deskY  = 300 - (deskCm * 2.05);
    const headY  = chairY - 120;
    const eyeY   = headY - 2;
    const spineY = chairY;

    // Update SVG elements dynamically
    const chairSeat = $('chairSeat');
    if(chairSeat){
        chairSeat.setAttribute('y', chairY);
    }
    const chairStem = $('chairStem');
    if(chairStem){
        chairStem.setAttribute('y2', chairY + 5);
    }
    const chairBack = $('chairBack');
    if(chairBack){
        chairBack.setAttribute('d', `M 150 ${chairY} L 145 ${chairY - 80} Q 148 ${chairY - 95} 152 ${chairY - 100}`);
    }

    // Desk elements
    const deskTop = $('deskTop');
    if(deskTop){
        deskTop.setAttribute('y', deskY);
    }
    const deskLeg = $('deskLeg');
    if(deskLeg){
        deskLeg.setAttribute('y1', deskY + 8);
    }

    // Student anatomy
    const svgHead = $('svgHead');
    if(svgHead){
        svgHead.setAttribute('cy', headY);
    }
    const svgEye = $('svgEye');
    if(svgEye){
        svgEye.setAttribute('cy', eyeY);
    }
    const svgSpine = $('svgSpine');
    if(svgSpine){
        svgSpine.setAttribute('y1', headY + 18);
        svgSpine.setAttribute('y2', spineY);
    }
    const svgThigh = $('svgThigh');
    if(svgThigh){
        svgThigh.setAttribute('y1', spineY);
        svgThigh.setAttribute('y2', spineY);
    }
    const svgShin = $('svgShin');
    if(svgShin){
        svgShin.setAttribute('y1', spineY);
    }
    const svgArm = $('svgArm');
    if(svgArm){
        svgArm.setAttribute('points', `190,${headY + 35} 210,${deskY + 5} 270,${deskY + 5}`);
    }

    // Monitor positioning depending on setup
    const screenGroup = $('screenGroup');
    if(screenGroup){
        let screenYOffset = 0;
        if(setup === 'laptop_desk'){
            screenYOffset = deskY - 145; // lower screen
        } else if(setup === 'laptop_stand'){
            screenYOffset = deskY - 165; // elevated on stand
        } else {
            screenYOffset = deskY - 175; // full desktop monitor
        }
        screenGroup.setAttribute('transform', `translate(0, ${screenYOffset})`);
    }

    // Sight line
    const svgSight = $('svgSightLine');
    if(svgSight){
        svgSight.setAttribute('y1', eyeY);
        const targetScreenY = setup === 'laptop_desk' ? deskY - 20 : eyeY - 5;
        svgSight.setAttribute('y2', targetScreenY);
    }

    // Dimension Lines position and text
    const cDim = $('svgChairDimText');
    if(cDim) {
        cDim.textContent = fmt(chairCm);
        cDim.setAttribute('y', (300 + chairY) / 2 + 4);
    }
    const cArrow = $('svgChairDimArrow');
    if(cArrow) cArrow.setAttribute('y2', chairY);
    const cTick = $('svgChairDimTickTop');
    if(cTick) {
        cTick.setAttribute('y1', chairY);
        cTick.setAttribute('y2', chairY);
    }

    const dDim = $('svgDeskDimText');
    if(dDim) {
        dDim.textContent = fmt(deskCm);
        dDim.setAttribute('y', (300 + deskY) / 2 + 4);
    }
    const dArrow = $('svgDeskDimArrow');
    if(dArrow) dArrow.setAttribute('y2', deskY);
    const dTick = $('svgDeskDimTickTop');
    if(dTick) {
        dTick.setAttribute('y1', deskY);
        dTick.setAttribute('y2', deskY);
    }

    const distDim = $('svgDistDimText');
    if(distDim) distDim.textContent = fmt(distCm);

    // Dynamic Recommendation Tip
    const tipEl = $('bpDynamicTip');
    if(tipEl){
        let setupAdvice = '';
        if(setup === 'laptop_desk'){
            setupAdvice = '<strong>Ergonomic Notice:</strong> Operating a laptop flat directly on desk level induces 35°-45° cervical flexion. Elevate display using a stand or riser.';
        } else if(setup === 'laptop_stand'){
            setupAdvice = `<strong>Optimal Configuration:</strong> Elevated laptop display paired with external peripherals at ${fmt(deskCm)} maintains neutral spinal alignment and relaxed wrists.`;
        } else {
            setupAdvice = `<strong>Desktop Workspace:</strong> Position monitor ~${fmt(distCm)} away with top edge at eye level (~${fmt(eyeCm)} from floor).`;
        }
        tipEl.innerHTML = setupAdvice;
    }
}

function initErgoCalc(){
    const slider = $('ergoHeightSlider');
    if(slider){
        slider.value = S.ergoHeight;
        slider.addEventListener('input', (e) => {
            S.ergoHeight = parseInt(e.target.value);
            localStorage.setItem('wa_ergo_height', S.ergoHeight);
            
            // Sync preset buttons
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.height) === S.ergoHeight);
            });
            
            updateErgoCalc();
        });
    }

    // Unit toggle (Metric vs Imperial)
    $('unitCmBtn')?.addEventListener('click', () => {
        S.ergoUnit = 'cm';
        localStorage.setItem('wa_ergo_unit', 'cm');
        $('unitCmBtn').classList.add('active');
        $('unitFtBtn').classList.remove('active');
        updateErgoCalc();
    });
    $('unitFtBtn')?.addEventListener('click', () => {
        S.ergoUnit = 'in';
        localStorage.setItem('wa_ergo_unit', 'in');
        $('unitFtBtn').classList.add('active');
        $('unitCmBtn').classList.remove('active');
        updateErgoCalc();
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const h = parseInt(btn.dataset.height);
            S.ergoHeight = h;
            if(slider) slider.value = h;
            localStorage.setItem('wa_ergo_height', h);
            updateErgoCalc();
        });
    });

    // Workspace setup buttons
    document.querySelectorAll('.setup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.setup-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            S.ergoSetup = btn.dataset.setup;
            localStorage.setItem('wa_ergo_setup', S.ergoSetup);
            updateErgoCalc();
        });
    });

    updateErgoCalc();
}
