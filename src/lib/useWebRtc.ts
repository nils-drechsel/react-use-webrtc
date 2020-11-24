import { useRef, MutableRefObject} from 'react';


export const useWebRtc = <TYPE>(variable: TYPE): MutableRefObject<TYPE> => {

    const stateRef = useRef(variable);
    stateRef.current = variable;

    return stateRef;
}

