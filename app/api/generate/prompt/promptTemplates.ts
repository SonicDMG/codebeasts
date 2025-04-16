/**
 * A style prefix for consistent image generation prompts, describing the desired pixel art and lighting style for Code Beasts.
 */
export const PROMPT_PREFIX = `Kawaii bizarre chimera hybrid creature, ultra low-resolution pixel 16-bit
pixel art style. Extremely pixelated NES/SNES aesthetic, chunky dithering patterns,
and high contrast. Strong directional lighting from the upper left, casting distinct
pixelated shadows on the right side. Rainbow gradient background. Subject facing the
camera, frontal view, medium shot, centered subject, shallow depth of field background.`;

export const ACTION_FIGURE_PROMPT_TEMPLATE = `
At the very top of the packaging, a bold red header band displays the text: '[Name] the [Title]' in large, clear, white letters.
Full product shot of a highly detailed action figure of a person, fully encased in a
clear plastic blister pack with a colorful cardboard backing. The main action figure
is a realistic human based on [character description], with lifelike features and natural
proportions. The action figure is shown in full body, including legs, standing upright
inside the blister pack. The packaging is the main focus, with a clear plastic bubble covering
the entire figure and all accessories. Inside the blister pack are compartments for
each coding language and its animal ([key items]), as well as coding-related
accessories such as a keyboard, laptop, or code book. Each item is in its own
separate compartment. The packaging is centered on a white background, with a red
header band reading '[Name] the [Title]' in bold white text, and an 'Ages [X]+' label.
Professional retail packaging with detailed labeling and product information. Sharp
focus on packaging details. No cropping of the blister pack.
`;

export const ACTION_FIGURE_PROMPT_WITH_IMAGE_TEMPLATE = `
At the very top of the packaging, a bold red header band displays the text:
'[Name] the [Title]' in large, clear, white letters.
Full product shot of a highly detailed action figure, fully encased in a clear plastic
blister pack with a colorful cardboard backing. The packaging, accessories, and
compartments are the main focus. The action figure is shown in full body, including
legs, standing upright inside the blister pack. Inside the blister pack are
compartments for each coding language and its animal ([key items]), as well as
coding-related accessories such as a keyboard, laptop, or code book. Each item is in
its own separate compartment. The figure's facial features are subtly inspired by:
[person_features]. The packaging is centered on a white background, with an 'Ages [X]+'
label. Professional retail packaging with detailed labeling and product information.
Sharp focus on packaging details. No cropping of the blister pack.
`; 