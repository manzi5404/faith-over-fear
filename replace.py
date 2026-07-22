import re

with open('c:/Users/manzi/Documents/Projects/FOF/faith-over-fear/product.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Actions section
regex = re.compile(r'<!-- Actions -->\s*<div class="flex flex-col space-y-4">\s*<template x-if="product\.isWaitlist">.*?</template>\s*</div>', re.DOTALL)

new_block = """<!-- Actions -->
                    <div class="flex flex-col space-y-4">
                        <!-- Upcoming Status -->
                        <template x-if="product.status === 'upcoming'">
                            <button class="w-full bg-black border border-zinc-800 text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs py-6 cursor-not-allowed"
                                    disabled>
                                Coming Soon
                            </button>
                        </template>

                        <!-- Reservation Status -->
                        <template x-if="product.status === 'reservation'">
                            <div class="space-y-6">
                                <div class="bg-zinc-900/50 border border-zinc-800 p-6 rounded-sm space-y-4">
                                    <h4 class="text-[10px] uppercase font-bold tracking-[0.3em] text-fof-accent">How to Reserve Your Drop</h4>
                                    <ol class="space-y-3 text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                                        <li class="flex items-start">
                                            <span class="text-fof-accent mr-3">01.</span>
                                            <span>Click the button below to secure your piece.</span>
                                        </li>
                                        <li class="flex items-start">
                                            <span class="text-fof-accent mr-3">02.</span>
                                            <span>Our team will contact you once production starts.</span>
                                        </li>
                                        <li class="flex items-start">
                                            <span class="text-fof-accent mr-3">03.</span>
                                            <span>Payment is only requested when the item is ready.</span>
                                        </li>
                                    </ol>
                                    <div class="pt-2">
                                        <label class="flex items-center space-x-3 cursor-pointer group">
                                            <input type="checkbox" x-model="viewedInstructions" class="form-checkbox bg-black border-zinc-800 text-fof-accent focus:ring-0 focus:ring-offset-0 w-4 h-4 rounded-none transition-all">
                                            <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 group-hover:text-white transition-colors">I understand the reservation process</span>
                                        </label>
                                    </div>
                                </div>

                                <button class="w-full bg-fof-accent text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-black transition-all py-6 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                                        :disabled="!viewedInstructions"
                                        @click="reserve()">
                                    Reserve Now
                                </button>
                            </div>
                        </template>

                        <!-- Live Status -->
                        <template x-if="product.status === 'live'">
                            <div class="flex flex-col space-y-4">
                                <div class="flex items-center space-x-4 h-16">
                                    <div class="flex items-center border border-zinc-800 h-full">
                                        <button class="px-6 h-full hover:bg-zinc-800 transition-colors text-xl" @click="quantity > 1 ? quantity-- : null">-</button>
                                        <span class="px-4 font-mono font-bold text-lg min-w-[3rem] text-center" x-text="quantity"></span>
                                        <button class="px-6 h-full hover:bg-zinc-800 transition-colors text-xl" @click="quantity++">+</button>
                                    </div>
                                    <button class="flex-1 bg-fof-white text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-fof-accent hover:text-white transition-all h-full"
                                            @click="addToCart()">
                                        Add To Cart
                                    </button>
                                </div>
                                <button class="w-full bg-fof-accent text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-black transition-all py-6"
                                        @click="payWithMoMo()">
                                    Pay with MoMo
                                </button>
                            </div>
                        </template>
                    </div>"""

if "product.isWaitlist" in content:
    content = regex.sub(new_block, content)
    with open('c:/Users/manzi/Documents/Projects/FOF/faith-over-fear/product.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("isWaitlist not found")
