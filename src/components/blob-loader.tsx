const BlobLoader = () => {
    return (
        <div  className={'loaderWrap w-24 h-24'}>
            <svg id="organic-blob" viewBox="0 0 300 300" width="300" height="300" xmlns="http://www.w3.org/2000/svg" filter="url(#goo)">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                    </filter>
                </defs>
                <circle id="Circle1"></circle>
                <circle id="Circle2"></circle>
                <circle id="Circle3"></circle>
                <circle id="Circle4"></circle>
            </svg>
        </div>

    )
}

export default BlobLoader