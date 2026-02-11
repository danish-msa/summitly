import { ButtonColorful } from "@/components/ui/button-colorful"

function ButtonColorfulDemo() {
    return (
        <div className="flex flex-col gap-8 items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-4">Button Colorful Demo</h2>
            
            <div className="flex flex-wrap gap-4 items-center justify-center">
                <ButtonColorful label="Get Started" />
                <ButtonColorful label="Learn More" href="/about" />
                <ButtonColorful label="Contact Us" href="/contact" />
                <ButtonColorful label="View Properties" href="/listings" />
            </div>
            
            <div className="text-center text-muted-foreground">
                <p>Hover over the buttons to see the colorful gradient effect!</p>
            </div>
        </div>
    )
}

export { ButtonColorfulDemo }
