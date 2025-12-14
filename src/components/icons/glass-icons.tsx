import { useId } from "react";
import { cn } from "@/lib/utils";

interface GlassIconProps {
  className?: string;
  size?: number;
}
const glassStyle = {
  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,255,255,0.1))",
};

export function LocationIcon({ className, size = 24 }: GlassIconProps) {
  const uniqueId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>location</title>
      <g fill="none">
        <path d="M12 17C14.5847 17 16.9636 17.2231 18.7285 17.6006C19.6067 17.7884 20.3823 18.0253 20.9561 18.3154C21.5239 18.6026 22 19 22 19.5C22 20 21.5239 20.3974 20.9561 20.6846C20.3823 20.9747 19.6067 21.2116 18.7285 21.3994C16.9636 21.7769 14.5847 22 12 22C9.41532 22 7.03636 21.7769 5.27148 21.3994C4.39327 21.2116 3.61767 20.9747 3.04395 20.6846C2.47608 20.3974 2 20 2 19.5C2 19 2.47608 18.6026 3.04395 18.3154C3.61767 18.0253 4.39327 17.7884 5.27148 17.6006C7.03636 17.2231 9.41532 17 12 17ZM12 4C14.7614 4 17 6.23858 17 9C17 11.7614 14.7614 14 12 14C9.23858 14 7 11.7614 7 9C7 6.23858 9.23858 4 12 4Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="origin" mask={`url(#${uniqueId}_mask)`}></path>
        <path d="M12 17C14.5847 17 16.9636 17.2231 18.7285 17.6006C19.6067 17.7884 20.3823 18.0253 20.9561 18.3154C21.5239 18.6026 22 19 22 19.5C22 20 21.5239 20.3974 20.9561 20.6846C20.3823 20.9747 19.6067 21.2116 18.7285 21.3994C16.9636 21.7769 14.5847 22 12 22C9.41532 22 7.03636 21.7769 5.27148 21.3994C4.39327 21.2116 3.61767 20.9747 3.04395 20.6846C2.47608 20.3974 2 20 2 19.5C2 19 2.47608 18.6026 3.04395 18.3154C3.61767 18.0253 4.39327 17.7884 5.27148 17.6006C7.03636 17.2231 9.41532 17 12 17ZM12 4C14.7614 4 17 6.23858 17 9C17 11.7614 14.7614 14 12 14C9.23858 14 7 11.7614 7 9C7 6.23858 9.23858 4 12 4Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="clone" filter={`url(#${uniqueId}_filter)`} clipPath={`url(#${uniqueId}_clipPath)`}></path>
        <path d="M12 1C15.8041 1 19.9998 3.68995 20 8.59375C20 11.8252 18.0301 14.6669 16.2344 16.6074C15.3187 17.5969 14.4053 18.3973 13.7227 18.9502C13.5202 19.1142 13.3124 19.2741 13.1016 19.4307C12.4477 19.9161 11.5522 19.9163 10.8984 19.4307C10.6887 19.2749 10.4813 19.1154 10.2773 18.9502C9.59466 18.3973 8.68128 17.5969 7.76562 16.6074C5.96987 14.6669 4 11.8252 4 8.59375C4.00016 3.68995 8.1959 1 12 1ZM12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5Z" fill={`url(#${uniqueId}_existing_1)`} data-glass="blur"></path>
        <path d="M12 1C15.8041 1 19.9998 3.68995 20 8.59375C20 11.8252 18.0301 14.6669 16.2344 16.6074C15.3187 17.5969 14.4053 18.3973 13.7227 18.9502C13.5202 19.1142 13.3124 19.2741 13.1016 19.4307C12.4477 19.9161 11.5522 19.9163 10.8984 19.4307C10.6887 19.2749 10.4813 19.1154 10.2773 18.9502C9.59466 18.3973 8.68128 17.5969 7.76562 16.6074C5.96987 14.6669 4 11.8252 4 8.59375C4.00016 3.68995 8.1959 1 12 1ZM12 1.75C8.48519 1.75 4.75015 4.21892 4.75 8.59375C4.75 11.5329 6.55505 14.1943 8.31641 16.0977C9.20127 17.0538 10.086 17.8301 10.749 18.3672C10.9432 18.5245 11.1426 18.6773 11.3457 18.8281C11.7339 19.1164 12.2658 19.1166 12.6543 18.8281C12.8583 18.6767 13.0582 18.5234 13.251 18.3672C13.914 17.8301 14.7987 17.0538 15.6836 16.0977C17.4449 14.1943 19.25 11.5329 19.25 8.59375C19.2498 4.21892 15.5148 1.75 12 1.75Z" fill={`url(#${uniqueId}_existing_2)`}></path>
        <defs>
          <linearGradient id={`${uniqueId}_existing_0`} x1="12" y1="0" x2="12" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757"></stop>
            <stop offset="1" stopColor="#151515"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_1`} x1="12" y1="1" x2="12" y2="19.795" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity=".6"></stop>
            <stop offset="1" stopColor="#BBBBC0" stopOpacity=".6"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_2`} x1="12" y1="1" x2="12" y2="11.884" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <filter id={`${uniqueId}_filter`} x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
          </filter>
          <clipPath id={`${uniqueId}_clipPath`}>
            <path d="M12 1C15.8041 1 19.9998 3.68995 20 8.59375C20 11.8252 18.0301 14.6669 16.2344 16.6074C15.3187 17.5969 14.4053 18.3973 13.7227 18.9502C13.5202 19.1142 13.3124 19.2741 13.1016 19.4307C12.4477 19.9161 11.5522 19.9163 10.8984 19.4307C10.6887 19.2749 10.4813 19.1154 10.2773 18.9502C9.59466 18.3973 8.68128 17.5969 7.76562 16.6074C5.96987 14.6669 4 11.8252 4 8.59375C4.00016 3.68995 8.1959 1 12 1ZM12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5Z"></path>
          </clipPath>
          <mask id={`${uniqueId}_mask`}>
            <rect width="100%" height="100%" fill="#FFF"></rect>
            <path d="M12 1C15.8041 1 19.9998 3.68995 20 8.59375C20 11.8252 18.0301 14.6669 16.2344 16.6074C15.3187 17.5969 14.4053 18.3973 13.7227 18.9502C13.5202 19.1142 13.3124 19.2741 13.1016 19.4307C12.4477 19.9161 11.5522 19.9163 10.8984 19.4307C10.6887 19.2749 10.4813 19.1154 10.2773 18.9502C9.59466 18.3973 8.68128 17.5969 7.76562 16.6074C5.96987 14.6669 4 11.8252 4 8.59375C4.00016 3.68995 8.1959 1 12 1ZM12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5Z" fill="#000"></path>
          </mask>
        </defs>
      </g>
    </svg>
  );
}

export function CalendarIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="calendar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
        fill="url(#calendar-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function GearIcon({ className, size = 24 }: GlassIconProps) {
  const uniqueId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>nut</title>
      <g fill="none">
        <path d="M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="origin" mask={`url(#${uniqueId}_mask)`}></path>
        <path d="M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="clone" filter={`url(#${uniqueId}_filter)`} clipPath={`url(#${uniqueId}_clipPath)`}></path>
        <path d="M11.3564 1.06839C11.7803 0.975324 12.2197 0.975324 12.6436 1.06839C13.1227 1.17366 13.5721 1.44288 14.4697 1.98148L19.6699 5.10159C20.5191 5.61112 20.9444 5.86609 21.2529 6.21683C21.5259 6.52724 21.7316 6.89147 21.8574 7.28519C21.9996 7.7303 22 8.22639 22 9.21683V14.7823C22 15.7727 21.9995 16.2688 21.8574 16.7139C21.7316 17.1077 21.5259 17.4718 21.2529 17.7823C20.9444 18.1331 20.5192 18.3879 19.6699 18.8975L14.4697 22.0176C13.572 22.5562 13.1227 22.8254 12.6436 22.9307C12.2196 23.0238 11.7804 23.0238 11.3564 22.9307C10.8773 22.8254 10.428 22.5562 9.53027 22.0176L4.33008 18.8975C3.48079 18.3879 3.05563 18.1331 2.74707 17.7823C2.47414 17.4718 2.26838 17.1077 2.14258 16.7139C2.00054 16.2688 2 15.7727 2 14.7823V9.21683C2 8.22639 2.00043 7.7303 2.14258 7.28519C2.26843 6.89148 2.47413 6.52724 2.74707 6.21683C3.05563 5.86609 3.48087 5.61112 4.33008 5.10159L9.53027 1.98148C10.4279 1.44288 10.8773 1.17366 11.3564 1.06839ZM12 7.50003C9.5149 7.50003 7.50029 9.515 7.5 12C7.50002 14.4853 9.51473 16.5 12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.4997 9.515 14.4851 7.50003 12 7.50003Z" fill={`url(#${uniqueId}_existing_1)`} data-glass="blur"></path>
        <path d="M11.3564 1.06836C11.7803 0.9753 12.2197 0.9753 12.6436 1.06836C13.1227 1.17363 13.5721 1.44286 14.4697 1.98145L19.6699 5.10157C20.5191 5.61109 20.9444 5.86608 21.2529 6.21681C21.5259 6.52721 21.7316 6.89147 21.8574 7.28517C21.9996 7.73028 22 8.22639 22 9.21681V14.7822C22 15.7727 21.9995 16.2688 21.8574 16.7139C21.7316 17.1076 21.5258 17.4718 21.2529 17.7822C20.9444 18.1331 20.5192 18.3879 19.6699 18.8975L14.4697 22.0176C13.572 22.5562 13.1227 22.8254 12.6436 22.9307C12.2196 23.0238 11.7804 23.0238 11.3564 22.9307C10.8773 22.8254 10.428 22.5562 9.53027 22.0176L4.33008 18.8975C3.4808 18.3879 3.05562 18.1331 2.74707 17.7822C2.47415 17.4718 2.26838 17.1076 2.14258 16.7139C2.00055 16.2688 2 15.7727 2 14.7822V9.21681C2 8.22639 2.00043 7.73028 2.14258 7.28517C2.26843 6.89147 2.47413 6.52721 2.74707 6.21681C3.05563 5.86608 3.48088 5.61109 4.33008 5.10157L9.53027 1.98145C10.4279 1.44286 10.8773 1.17363 11.3564 1.06836ZM12.4824 1.80176C12.1646 1.73199 11.8354 1.73199 11.5176 1.80176C11.1866 1.87448 10.8586 2.05943 9.91602 2.62501L4.71582 5.74513C3.82368 6.28041 3.52364 6.47061 3.31055 6.7129C3.10623 6.94529 2.95196 7.21793 2.85742 7.51368C2.7592 7.82124 2.75 8.17741 2.75 9.21681V14.7822L2.75293 15.4444C2.76001 15.9975 2.78375 16.2557 2.85742 16.4863C2.95196 16.7821 3.10623 17.0547 3.31055 17.2871C3.52364 17.5294 3.82368 17.7196 4.71582 18.2549L9.91602 21.375C10.8586 21.9406 11.1866 22.1256 11.5176 22.1983C11.8354 22.268 12.1646 22.268 12.4824 22.1983C12.8134 22.1256 13.1414 21.9406 14.084 21.375L19.2842 18.2549C20.1763 17.7196 20.4764 17.5294 20.6895 17.2871C20.8938 17.0547 21.048 16.7821 21.1426 16.4863C21.2408 16.1787 21.25 15.822 21.25 14.7822V9.21681C21.25 8.17741 21.2408 7.82124 21.1426 7.51368C21.048 7.21793 20.8938 6.94529 20.6895 6.7129C20.4764 6.47061 20.1763 6.28041 19.2842 5.74513L14.084 2.62501C13.1414 2.05943 12.8134 1.87448 12.4824 1.80176Z" fill={`url(#${uniqueId}_existing_2)`}></path>
        <defs>
          <linearGradient id={`${uniqueId}_existing_0`} x1="12" y1="6" x2="12" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757"></stop>
            <stop offset="1" stopColor="#151515"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_1`} x1="12" y1=".999" x2="12" y2="23.001" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity=".6"></stop>
            <stop offset="1" stopColor="#BBBBC0" stopOpacity=".6"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_2`} x1="12" y1=".999" x2="12" y2="13.74" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <filter id={`${uniqueId}_filter`} x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
          </filter>
          <clipPath id={`${uniqueId}_clipPath`}>
            <path d="M11.3564 1.06839C11.7803 0.975324 12.2197 0.975324 12.6436 1.06839C13.1227 1.17366 13.5721 1.44288 14.4697 1.98148L19.6699 5.10159C20.5191 5.61112 20.9444 5.86609 21.2529 6.21683C21.5259 6.52724 21.7316 6.89147 21.8574 7.28519C21.9996 7.7303 22 8.22639 22 9.21683V14.7823C22 15.7727 21.9995 16.2688 21.8574 16.7139C21.7316 17.1077 21.5259 17.4718 21.2529 17.7823C20.9444 18.1331 20.5192 18.3879 19.6699 18.8975L14.4697 22.0176C13.572 22.5562 13.1227 22.8254 12.6436 22.9307C12.2196 23.0238 11.7804 23.0238 11.3564 22.9307C10.8773 22.8254 10.428 22.5562 9.53027 22.0176L4.33008 18.8975C3.48079 18.3879 3.05563 18.1331 2.74707 17.7823C2.47414 17.4718 2.26838 17.1077 2.14258 16.7139C2.00054 16.2688 2 15.7727 2 14.7823V9.21683C2 8.22639 2.00043 7.7303 2.14258 7.28519C2.26843 6.89148 2.47413 6.52724 2.74707 6.21683C3.05563 5.86609 3.48087 5.61112 4.33008 5.10159L9.53027 1.98148C10.4279 1.44288 10.8773 1.17366 11.3564 1.06839ZM12 7.50003C9.5149 7.50003 7.50029 9.515 7.5 12C7.50002 14.4853 9.51473 16.5 12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.4997 9.515 14.4851 7.50003 12 7.50003Z"></path>
          </clipPath>
          <mask id={`${uniqueId}_mask`}>
            <rect width="100%" height="100%" fill="#FFF"></rect>
            <path d="M11.3564 1.06839C11.7803 0.975324 12.2197 0.975324 12.6436 1.06839C13.1227 1.17366 13.5721 1.44288 14.4697 1.98148L19.6699 5.10159C20.5191 5.61112 20.9444 5.86609 21.2529 6.21683C21.5259 6.52724 21.7316 6.89147 21.8574 7.28519C21.9996 7.7303 22 8.22639 22 9.21683V14.7823C22 15.7727 21.9995 16.2688 21.8574 16.7139C21.7316 17.1077 21.5259 17.4718 21.2529 17.7823C20.9444 18.1331 20.5192 18.3879 19.6699 18.8975L14.4697 22.0176C13.572 22.5562 13.1227 22.8254 12.6436 22.9307C12.2196 23.0238 11.7804 23.0238 11.3564 22.9307C10.8773 22.8254 10.428 22.5562 9.53027 22.0176L4.33008 18.8975C3.48079 18.3879 3.05563 18.1331 2.74707 17.7823C2.47414 17.4718 2.26838 17.1077 2.14258 16.7139C2.00054 16.2688 2 15.7727 2 14.7823V9.21683C2 8.22639 2.00043 7.7303 2.14258 7.28519C2.26843 6.89148 2.47413 6.52724 2.74707 6.21683C3.05563 5.86609 3.48087 5.61112 4.33008 5.10159L9.53027 1.98148C10.4279 1.44288 10.8773 1.17366 11.3564 1.06839ZM12 7.50003C9.5149 7.50003 7.50029 9.515 7.5 12C7.50002 14.4853 9.51473 16.5 12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.4997 9.515 14.4851 7.50003 12 7.50003Z" fill="#000"></path>
          </mask>
        </defs>
      </g>
    </svg>
  );
}

export function LogOutIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logout-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
        fill="url(#logout-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function PlusIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="plus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
        fill="url(#plus-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function TrashIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill="url(#trash-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function HistoryIcon({ className, size = 24 }: GlassIconProps) {
  const uniqueId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>arrows-bold-opposite-direction</title>
      <g fill="none">
        <path d="M12 15.1099V12.134H18.5C19.3284 12.134 20 11.4624 20 10.634L20 6.63397C20 5.80555 19.3284 5.13398 18.5 5.13398L12 5.13398V2.15802C12 0.917543 10.58 0.213184 9.59238 0.963774L1.07138 7.43974C0.281546 8.04001 0.281546 9.22795 1.07138 9.82822L9.59238 16.3042C10.58 17.0548 12 16.3504 12 15.1099Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="origin" mask={`url(#${uniqueId}_mask)`}></path>
        <path d="M12 15.1099V12.134H18.5C19.3284 12.134 20 11.4624 20 10.634L20 6.63397C20 5.80555 19.3284 5.13398 18.5 5.13398L12 5.13398V2.15802C12 0.917543 10.58 0.213184 9.59238 0.963774L1.07138 7.43974C0.281546 8.04001 0.281546 9.22795 1.07138 9.82822L9.59238 16.3042C10.58 17.0548 12 16.3504 12 15.1099Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="clone" filter={`url(#${uniqueId}_filter)`} clipPath={`url(#${uniqueId}_clipPath)`}></path>
        <path d="M12 21.976L12 19L5.50001 19C4.67158 19 4 18.3284 4.00001 17.5L4.00003 13.5C4.00003 12.6716 4.67161 12 5.50003 12L12 12L12 9.02404C12 7.78356 13.42 7.07921 14.4076 7.8298L22.9286 14.3058C23.7185 14.906 23.7185 16.094 22.9286 16.6942L14.4076 23.1702C13.42 23.9208 12 23.2164 12 21.976Z" fill={`url(#${uniqueId}_existing_1)`} data-glass="blur"></path>
        <path d="M4 17.4996V13.4996C4.0001 12.6712 4.67165 11.9996 5.5 11.9996H12V9.024C12 7.78361 13.4196 7.07932 14.4072 7.82966L22.9287 14.3052C23.7185 14.9055 23.7184 16.0936 22.9287 16.6939L14.4072 23.1695C13.4505 23.8966 12.0881 23.2588 12.0039 22.0904L12 21.9761V18.9996H5.5V18.2496H12.75V21.9761C12.7503 22.5961 13.4604 22.948 13.9541 22.5728L22.4746 16.0972C22.8695 15.7971 22.8695 15.203 22.4746 14.9029L13.9541 8.42634C13.4603 8.05104 12.75 8.40376 12.75 9.024V12.7496H5.5C5.08586 12.7496 4.7501 13.0855 4.75 13.4996V17.4996C4.75 17.9138 5.08579 18.2496 5.5 18.2496V18.9996L5.34668 18.9918C4.59028 18.915 4 18.2762 4 17.4996Z" fill={`url(#${uniqueId}_existing_2)`}></path>
        <defs>
          <linearGradient id={`${uniqueId}_existing_0`} x1="10.239" y1=".655" x2="10.239" y2="16.613" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757"></stop>
            <stop offset="1" stopColor="#151515"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_1`} x1="24.5" y1="15.5" x2="4" y2="15.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity=".6"></stop>
            <stop offset="1" stopColor="#BBBBC0" stopOpacity=".6"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_2`} x1="13.761" y1="7.521" x2="13.761" y2="16.762" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <filter id={`${uniqueId}_filter`} x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
          </filter>
          <clipPath id={`${uniqueId}_clipPath`}>
            <path d="M12 21.976L12 19L5.50001 19C4.67158 19 4 18.3284 4.00001 17.5L4.00003 13.5C4.00003 12.6716 4.67161 12 5.50003 12L12 12L12 9.02404C12 7.78356 13.42 7.07921 14.4076 7.8298L22.9286 14.3058C23.7185 14.906 23.7185 16.094 22.9286 16.6942L14.4076 23.1702C13.42 23.9208 12 23.2164 12 21.976Z"></path>
          </clipPath>
          <mask id={`${uniqueId}_mask`}>
            <rect width="100%" height="100%" fill="#FFF"></rect>
            <path d="M12 21.976L12 19L5.50001 19C4.67158 19 4 18.3284 4.00001 17.5L4.00003 13.5C4.00003 12.6716 4.67161 12 5.50003 12L12 12L12 9.02404C12 7.78356 13.42 7.07921 14.4076 7.8298L22.9286 14.3058C23.7185 14.906 23.7185 16.094 22.9286 16.6942L14.4076 23.1702C13.42 23.9208 12 23.2164 12 21.976Z" fill="#000"></path>
          </mask>
        </defs>
      </g>
    </svg>
  );
}

export function MenuIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="menu-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
        fill="url(#menu-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function SitemapIcon({ className, size = 24 }: GlassIconProps) {
  const uniqueId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>sitemap</title>
      <g fill="none">
        <path d="M13 10H17C18.6569 10 20 11.3431 20 13V18C20 18.5523 19.5523 19 19 19C18.4477 19 18 18.5523 18 18V13C18 12.4477 17.5523 12 17 12H7C6.44772 12 6 12.4477 6 13V18C6 18.5523 5.55228 19 5 19C4.44772 19 4 18.5523 4 18V13C4 11.3431 5.34315 10 7 10H11V5.5C11 4.94772 11.4477 4.5 12 4.5C12.5523 4.5 13 4.94772 13 5.5V10Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="origin" mask={`url(#${uniqueId}_mask)`}></path>
        <path d="M13 10H17C18.6569 10 20 11.3431 20 13V18C20 18.5523 19.5523 19 19 19C18.4477 19 18 18.5523 18 18V13C18 12.4477 17.5523 12 17 12H7C6.44772 12 6 12.4477 6 13V18C6 18.5523 5.55228 19 5 19C4.44772 19 4 18.5523 4 18V13C4 11.3431 5.34315 10 7 10H11V5.5C11 4.94772 11.4477 4.5 12 4.5C12.5523 4.5 13 4.94772 13 5.5V10Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="clone" filter={`url(#${uniqueId}_filter)`} clipPath={`url(#${uniqueId}_clipPath)`}></path>
        <path d="M5 15C6.933 15 8.5 16.567 8.5 18.5C8.5 20.433 6.933 22 5 22C3.067 22 1.5 20.433 1.5 18.5C1.5 16.567 3.067 15 5 15ZM19 15C20.933 15 22.5 16.567 22.5 18.5C22.5 20.433 20.933 22 19 22C17.067 22 15.5 20.433 15.5 18.5C15.5 16.567 17.067 15 19 15ZM12 0.5C13.933 0.5 15.5 2.067 15.5 4C15.5 5.933 13.933 7.5 12 7.5C10.067 7.5 8.5 5.933 8.5 4C8.5 2.067 10.067 0.5 12 0.5Z" fill={`url(#${uniqueId}_existing_1)`} data-glass="blur"></path>
        <path d="M14.75 4C14.75 2.48122 13.5188 1.25 12 1.25C10.4812 1.25 9.25 2.48122 9.25 4C9.25 5.51878 10.4812 6.75 12 6.75V7.5C10.067 7.5 8.5 5.933 8.5 4C8.5 2.067 10.067 0.5 12 0.5C13.933 0.5 15.5 2.067 15.5 4C15.5 5.933 13.933 7.5 12 7.5V6.75C13.5188 6.75 14.75 5.51878 14.75 4Z" fill={`url(#${uniqueId}_existing_4)`}></path>
        <path d="M7.75 18.5C7.75 16.9812 6.51878 15.75 5 15.75C3.48122 15.75 2.25 16.9812 2.25 18.5C2.25 20.0188 3.48122 21.25 5 21.25V22C3.067 22 1.5 20.433 1.5 18.5C1.5 16.567 3.067 15 5 15C6.933 15 8.5 16.567 8.5 18.5C8.5 20.433 6.933 22 5 22V21.25C6.51878 21.25 7.75 20.0188 7.75 18.5Z" fill={`url(#${uniqueId}_existing_5)`}></path>
        <path d="M21.75 18.5C21.75 16.9812 20.5188 15.75 19 15.75C17.4812 15.75 16.25 16.9812 16.25 18.5C16.25 20.0188 17.4812 21.25 19 21.25V22C17.067 22 15.5 20.433 15.5 18.5C15.5 16.567 17.067 15 19 15C20.933 15 22.5 16.567 22.5 18.5C22.5 20.433 20.933 22 19 22V21.25C20.5188 21.25 21.75 20.0188 21.75 18.5Z" fill={`url(#${uniqueId}_existing_6)`}></path>
        <defs>
          <linearGradient id={`${uniqueId}_existing_0`} x1="12" y1="4.5" x2="12" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757"></stop>
            <stop offset="1" stopColor="#151515"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_1`} x1="12" y1=".5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity=".6"></stop>
            <stop offset="1" stopColor="#BBBBC0" stopOpacity=".6"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_4`} x1="12" y1=".5" x2="12" y2="4.554" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_5`} x1="5" y1="15" x2="5" y2="19.054" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_6`} x1="19" y1="15" x2="19" y2="19.054" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <filter id={`${uniqueId}_filter`} x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
          </filter>
          <clipPath id={`${uniqueId}_clipPath`}>
            <path d="M5 15C6.933 15 8.5 16.567 8.5 18.5C8.5 20.433 6.933 22 5 22C3.067 22 1.5 20.433 1.5 18.5C1.5 16.567 3.067 15 5 15ZM19 15C20.933 15 22.5 16.567 22.5 18.5C22.5 20.433 20.933 22 19 22C17.067 22 15.5 20.433 15.5 18.5C15.5 16.567 17.067 15 19 15ZM12 0.5C13.933 0.5 15.5 2.067 15.5 4C15.5 5.933 13.933 7.5 12 7.5C10.067 7.5 8.5 5.933 8.5 4C8.5 2.067 10.067 0.5 12 0.5Z"></path>
          </clipPath>
          <mask id={`${uniqueId}_mask`}>
            <rect width="100%" height="100%" fill="#FFF"></rect>
            <path d="M5 15C6.933 15 8.5 16.567 8.5 18.5C8.5 20.433 6.933 22 5 22C3.067 22 1.5 20.433 1.5 18.5C1.5 16.567 3.067 15 5 15ZM19 15C20.933 15 22.5 16.567 22.5 18.5C22.5 20.433 20.933 22 19 22C17.067 22 15.5 20.433 15.5 18.5C15.5 16.567 17.067 15 19 15ZM12 0.5C13.933 0.5 15.5 2.067 15.5 4C15.5 5.933 13.933 7.5 12 7.5C10.067 7.5 8.5 5.933 8.5 4C8.5 2.067 10.067 0.5 12 0.5Z" fill="#000"></path>
          </mask>
        </defs>
      </g>
    </svg>
  );
}

export function CloseIcon({ className, size = 24 }: GlassIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="close-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
      <path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill="url(#close-gradient)"
        style={glassStyle}
      />
    </svg>
  );
}

export function UsersIcon({ className, size = 24 }: GlassIconProps) {
  const uniqueId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>users</title>
      <g fill="none">
        <path d="M15.9414 10C19.8397 10.0001 22.9999 13.1603 23 17.0586C23 18.1307 22.1307 19 21.0586 19H9.94141C8.86932 19 8 18.1307 8 17.0586C8.00012 13.1603 11.1603 10.0001 15.0586 10H15.9414ZM15.5 1C17.433 1 19 2.567 19 4.5C19 6.433 17.433 8 15.5 8C13.567 8 12 6.433 12 4.5C12 2.567 13.567 1 15.5 1Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="origin" mask={`url(#${uniqueId}_mask)`}></path>
        <path d="M15.9414 10C19.8397 10.0001 22.9999 13.1603 23 17.0586C23 18.1307 22.1307 19 21.0586 19H9.94141C8.86932 19 8 18.1307 8 17.0586C8.00012 13.1603 11.1603 10.0001 15.0586 10H15.9414ZM15.5 1C17.433 1 19 2.567 19 4.5C19 6.433 17.433 8 15.5 8C13.567 8 12 6.433 12 4.5C12 2.567 13.567 1 15.5 1Z" fill={`url(#${uniqueId}_existing_0)`} data-glass="clone" filter={`url(#${uniqueId}_filter)`} clipPath={`url(#${uniqueId}_clipPath)`}></path>
        <path d="M10.3076 12C14.556 12 18 15.444 18 19.6924C18 20.9668 16.9668 22 15.6924 22H4.30762C3.03317 22 2.00004 20.9668 2 19.6924C2 15.444 5.44404 12 9.69238 12H10.3076ZM10 2C12.2091 2 14 3.79086 14 6C14 8.20914 12.2091 10 10 10C7.79086 10 6 8.20914 6 6C6 3.79086 7.79086 2 10 2Z" fill={`url(#${uniqueId}_existing_1)`} data-glass="blur"></path>
        <path d="M13.25 6C13.25 4.20507 11.7949 2.75 10 2.75C8.20507 2.75 6.75 4.20507 6.75 6C6.75 7.79493 8.20507 9.25 10 9.25V10C7.79086 10 6 8.20914 6 6C6 3.79086 7.79086 2 10 2C12.2091 2 14 3.79086 14 6C14 8.20914 12.2091 10 10 10V9.25C11.7949 9.25 13.25 7.79493 13.25 6Z" fill={`url(#${uniqueId}_existing_2)`}></path>
        <path d="M15.6924 21.25V22H4.30762V21.25H15.6924ZM17.25 19.6924C17.25 15.8583 14.1417 12.75 10.3076 12.75H9.69238C5.85825 12.75 2.75 15.8583 2.75 19.6924C2.75004 20.5526 3.44739 21.25 4.30762 21.25V22C3.11295 22 2.13009 21.0921 2.01172 19.9287L2 19.6924C2 15.5767 5.23229 12.2156 9.29688 12.0098L9.69238 12H10.3076C14.556 12 18 15.444 18 19.6924L17.9883 19.9287C17.8778 21.0145 17.0145 21.8778 15.9287 21.9883L15.6924 22V21.25C16.5526 21.25 17.25 20.5526 17.25 19.6924Z" fill={`url(#${uniqueId}_existing_3)`}></path>
        <defs>
          <linearGradient id={`${uniqueId}_existing_0`} x1="15.5" y1="1" x2="15.5" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="#575757"></stop>
            <stop offset="1" stopColor="#151515"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_1`} x1="10" y1="2" x2="10" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E3E3E5" stopOpacity="0.6"></stop>
            <stop offset="1" stopColor="#BBBBC0" stopOpacity="0.6"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_2`} x1="10" y1="2" x2="10" y2="6.633" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <linearGradient id={`${uniqueId}_existing_3`} x1="10" y1="12" x2="10" y2="17.791" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <filter id={`${uniqueId}_filter`} x="-100%" y="-100%" width="400%" height="400%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" edgeMode="none" result="blur"></feGaussianBlur>
          </filter>
          <clipPath id={`${uniqueId}_clipPath`}>
            <path d="M10.3076 12C14.556 12 18 15.444 18 19.6924C18 20.9668 16.9668 22 15.6924 22H4.30762C3.03317 22 2.00004 20.9668 2 19.6924C2 15.444 5.44404 12 9.69238 12H10.3076ZM10 2C12.2091 2 14 3.79086 14 6C14 8.20914 12.2091 10 10 10C7.79086 10 6 8.20914 6 6C6 3.79086 7.79086 2 10 2Z"></path>
          </clipPath>
          <mask id={`${uniqueId}_mask`}>
            <rect width="100%" height="100%" fill="#FFF"></rect>
            <path d="M10.3076 12C14.556 12 18 15.444 18 19.6924C18 20.9668 16.9668 22 15.6924 22H4.30762C3.03317 22 2.00004 20.9668 2 19.6924C2 15.444 5.44404 12 9.69238 12H10.3076ZM10 2C12.2091 2 14 3.79086 14 6C14 8.20914 12.2091 10 10 10C7.79086 10 6 8.20914 6 6C6 3.79086 7.79086 2 10 2Z" fill="#000"></path>
          </mask>
        </defs>
      </g>
    </svg>
  );
}
